import {
	createAgentFromDB,
	getUserAvailableIntegrations,
} from "@api/ai/agents/agent-factory";
import { type AppContext, buildAppContext } from "@api/ai/agents/config/shared";
import {
	buildProjectManagerSystemPrompt,
	type ProjectManagerContext,
	type ProjectManagerTrigger,
	updateProjectMemoryTool,
} from "@api/ai/agents/project-manager";
import { getAllTools } from "@api/ai/tools/tool-registry";
import type { UIChatMessage } from "@api/ai/types";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { calculateTokenUsageCost, checkPlanFeatures } from "@mimir/billing";
import { db } from "@mimir/db/client";
import { createActivity } from "@mimir/db/queries/activities";
import { isSystemUser } from "@mimir/db/queries/agent-triggers";
import {
	getAgentById,
	getAgentByUserId,
	getAgents,
} from "@mimir/db/queries/agents";
import {
	getChatById,
	saveChat,
	saveChatMessage,
} from "@mimir/db/queries/chats";
import { getCreditBalance, recordCreditUsage } from "@mimir/db/queries/credits";
import { getMilestones } from "@mimir/db/queries/milestones";
import {
	addProjectExecutionUsageMetrics,
	createProjectExecution,
	getProjectExecution,
	updateProjectExecution,
} from "@mimir/db/queries/project-executions";
import { getProjectById } from "@mimir/db/queries/projects";
import { createTaskComment, getTasks } from "@mimir/db/queries/tasks";
import { getMembers, getTeamById } from "@mimir/db/queries/teams";
import { getSystemUser } from "@mimir/db/queries/users";
import { statuses } from "@mimir/db/schema";
import { AGENT_DEFAULT_MODEL } from "@mimir/utils/agents";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateId, stepCountIs } from "ai";
import { eq } from "drizzle-orm";
import z from "zod";

const PM_JOB_ID = "execute-pm-agent";

/**
 * Job that executes the Project Manager agent for project orchestration
 *
 * This job:
 * 1. Loads full project context (milestones, tasks, agents, members, statuses)
 * 2. Runs the PM agent with the appropriate trigger
 * 3. The PM agent creates/assigns tasks, reviews work, re-scopes milestones
 * 4. Posts a summary comment on the project or relevant task
 */
export const executePMAgentJob = schemaTask({
	id: PM_JOB_ID,
	schema: z.object({
		projectId: z.string(),
		teamId: z.string(),
		trigger: z.object({
			type: z.enum([
				"task_status_changed",
				"task_completed",
				"milestone_completed",
				"agent_mention",
				"project_created",
				"manual",
			]),
			taskId: z.string().optional(),
			taskTitle: z.string().optional(),
			oldStatus: z.string().optional(),
			newStatus: z.string().optional(),
			newStatusType: z.string().optional(),
			milestoneId: z.string().optional(),
			milestoneName: z.string().optional(),
			mentionedByUserId: z.string().optional(),
			mentionedByUserName: z.string().optional(),
			message: z.string().optional(),
			instruction: z.string().optional(),
		}),
	}),
	maxDuration: 15 * 60, // 15 minutes
	run: async (payload) => {
		const { projectId, teamId, trigger } = payload;

		logger.info("Starting PM agent execution", {
			projectId,
			triggerType: trigger.type,
		});

		// ── 1. Validate team ────────────────────────────────────────────────
		const team = await getTeamById(teamId);
		if (!team) {
			logger.error("Team not found for PM agent execution", { teamId });
			return { status: "failed", reason: "team_not_found" };
		}

		// ── 2. Validate project ─────────────────────────────────────────────
		const project = await getProjectById({ projectId, teamId });
		if (!project) {
			logger.error("Project not found", { projectId });
			return { status: "failed", reason: "project_not_found" };
		}

		// ── 3. Check plan & credits ─────────────────────────────────────────
		const canAccess = await checkPlanFeatures(teamId, ["ai"]);
		if (!canAccess) {
			logger.error("Team plan does not support AI features", { teamId });
			return { status: "failed", reason: "plan_cannot_access_ai_features" };
		}

		const creditBalance = await getCreditBalance({ teamId });
		if ((creditBalance?.balanceCents ?? 0) <= 0) {
			logger.warn("Insufficient credits for PM agent", { teamId });
			return { status: "failed", reason: "insufficient_credits" };
		}

		// ── 4. Resolve PM agent identity ────────────────────────────────────
		// The PM agent is the project lead, or the first active agent, or system user
		const { pmAgent, pmUserId } = await resolvePMAgent({
			project,
			teamId,
		});

		// ── 5. Build full context ───────────────────────────────────────────
		const pmContext = await buildPMContext({
			projectId,
			teamId,
			project,
			pmAgent,
			pmUserId,
			trigger: trigger as ProjectManagerTrigger,
		});

		// ── 6. Create/get execution record ─────────────────────────────────
		const execution = await createProjectExecution({
			projectId,
			teamId,
		});

		// ── 7. Mark as executing ────────────────────────────────────────────
		await Promise.all([
			updateProjectExecution({
				projectId,
				status: "executing",
			}),
		]);

		// ── 8. Build message based on trigger ───────────────────────────────
		const messageText = buildTriggerMessage(trigger as ProjectManagerTrigger);
		const message: UIChatMessage = {
			id: generateId(),
			role: "user",
			parts: [{ type: "text", text: messageText }],
		};

		// ── 9. Setup chat for context persistence ───────────────────────────
		const chatId = `pm-${projectId}`;
		const chat = await getChatById(chatId, teamId);
		if (!chat) {
			await saveChat({
				chatId,
				teamId,
				title: `PM: ${project.name}`,
				userId: pmUserId,
			});
		}

		await saveChatMessage({
			chatId,
			teamId,
			message,
			userId: pmUserId,
			role: "user",
		});

		try {
			// ── 10. Get tools ───────────────────────────────────────────────
			const userIntegrations = await getUserAvailableIntegrations({
				userId: pmAgent?.behalfUserId ?? pmUserId,
				teamId,
			});

			const { tools: allTools, toolboxes } = await getAllTools(
				userIntegrations,
				teamId,
				pmAgent?.behalfUserId ?? pmUserId,
			);

			const tools = {
				updateProjectMemory: updateProjectMemoryTool,
				...allTools,
			};

			// ── 11. Create and run agent ────────────────────────────────────
			const agent = await createAgentFromDB({
				agentId: pmAgent?.id,
				teamId,
				toolboxes,
				defaultActiveToolboxes: ["taskManagement", "research", "memory"],
				defaultActiveTools: ["updateProjectMemory"],
				config: {
					tools,
					experimental_context: pmContext,
					stopWhen: stepCountIs(50),
					buildInstructions: buildProjectManagerSystemPrompt as (
						ctx: AppContext,
					) => string,

					onStepFinish: async ({ toolResults }) => {
						for (const call of toolResults) {
							logger.info(`PM Tool: ${call.toolName}`, {
								toolName: call.toolName,
								input: call.input,
								output: call.output,
							});
						}
					},

					onFinish: async ({ totalUsage, finishReason }) => {
						const usageCost = await calculateTokenUsageCost({
							model: pmAgent?.model || AGENT_DEFAULT_MODEL,
							usage: totalUsage,
						});
						await addProjectExecutionUsageMetrics(projectId, {
							inputTokens: totalUsage.inputTokens || 0,
							outputTokens: totalUsage.outputTokens || 0,
							totalTokens: totalUsage.totalTokens || 0,
							costUSD: usageCost?.costUSD || 0,
						});

						const usageCostCents = Math.round((usageCost?.costUSD || 0) * 100);
						if (usageCostCents > 0) {
							await recordCreditUsage({
								teamId,
								amountCents: usageCostCents,
								metadata: {
									projectId,
									type: "pm-agent",
									model:
										usageCost?.model || pmAgent?.model || AGENT_DEFAULT_MODEL,
									inputTokens: totalUsage.inputTokens || 0,
									outputTokens: totalUsage.outputTokens || 0,
									totalTokens: totalUsage.totalTokens || 0,
									costUSD: usageCost?.costUSD || 0,
								},
							});
						}
						logger.info("Agent OnFinish", { totalUsage, finishReason });
					},
				},
			});

			logger.info("Running PM agent", { projectId });
			const response = await agent.generate({
				context: pmContext,
				message,
			});
			logger.info("PM agent execution completed", { projectId });

			// Save response to chat
			await saveChatMessage({
				chatId,
				teamId,
				message: response,
				userId: pmUserId,
				role: "assistant",
			});

			// If trigger was about a specific task, post the response as a comment
			if (trigger.taskId) {
				const textParts = response.parts.filter((p) => p.type === "text");
				const lastText = textParts[textParts.length - 1]?.text || "";
				const cleanedResponse = lastText.replace(/<[^>]*>/g, "");

				if (cleanedResponse.trim()) {
					await createTaskComment({
						taskId: trigger.taskId,
						userId: pmUserId,
						teamId,
						comment: cleanedResponse,
					});
				}
			}

			// ── 12. Mark idle (PM stays alive for future triggers) ────────
			await Promise.all([
				updateProjectExecution({
					projectId,
					status: "idle",
					completedAt: new Date().toISOString(),
				}),
			]);

			return { status: "completed" };
		} catch (error) {
			logger.error("PM agent execution failed", { error });
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			await updateProjectExecution({
				projectId,
				status: "failed",
				lastError: errorMessage,
				completedAt: new Date().toISOString(),
			});

			return { status: "failed", reason: "unexpected_error" };
		}
	},
});

// ─── Context builder ────────────────────────────────────────────────────────

async function buildPMContext({
	projectId,
	teamId,
	project,
	pmAgent,
	pmUserId,
	trigger,
}: {
	projectId: string;
	teamId: string;
	project: Awaited<ReturnType<typeof getProjectById>>;
	pmAgent: Awaited<ReturnType<typeof getAgentById>> | null;
	pmUserId: string;
	trigger: ProjectManagerTrigger;
}): Promise<ProjectManagerContext> {
	// Fetch all context in parallel
	const [
		milestoneResult,
		tasksResult,
		agents,
		members,
		teamStatuses,
		userContext,
		execution,
	] = await Promise.all([
		getMilestones({ teamId, projectId, pageSize: 50 }),
		getTasks({ teamId, projectId: [projectId], pageSize: 100, view: "board" }),
		getAgents({ teamId, isActive: true, pageSize: 50 }),
		getMembers({ teamId, includeSystemUsers: true }),
		db
			.select({
				id: statuses.id,
				name: statuses.name,
				type: statuses.type,
			})
			.from(statuses)
			.where(eq(statuses.teamId, teamId)),
		getUserContext({ userId: pmUserId, teamId }),
		createProjectExecution({
			projectId,
			teamId,
		}),
	]);

	const pmContext: ProjectManagerContext = {
		...buildAppContext(
			{
				...userContext,
				integrationType: "web",
				behalfUserId: pmAgent?.behalfUserId ?? pmUserId,
			},
			`pm-${projectId}`,
		),
		agentId: pmAgent?.id,
		project: {
			id: projectId,
			name: project.name,
			description: project.description ?? undefined,
			status: project.status ?? undefined,
			startDate: project.startDate ?? undefined,
			endDate: project.endDate ?? undefined,
			leadId: project.leadId ?? undefined,
			color: project.color ?? undefined,
		},
		milestones: milestoneResult.data.map(
			(m: {
				id: string;
				name: string;
				description: string | null;
				dueDate: string | null;
				progress: { completed: number; inProgress: number };
			}) => ({
				id: m.id,
				name: m.name,
				description: m.description ?? undefined,
				dueDate: m.dueDate ?? undefined,
				progress: m.progress
					? {
							completed: m.progress.completed ?? 0,
							inProgress: m.progress.inProgress ?? 0,
							total: (m.progress.completed ?? 0) + (m.progress.inProgress ?? 0),
						}
					: undefined,
			}),
		),
		tasks: tasksResult.data.map(
			(t: {
				id: string;
				title: string;
				statusId: string;
				priority: string | null;
				assigneeId: string | null;
				milestoneId: string | null;
				milestone: { id: string | null; name: string | null } | null;
				dueDate: string | null;
				labels: Array<{ id: string; name: string }> | null;
				checklistSummary: {
					total: number | null;
					completed: number | null;
				} | null;
			}) => ({
				id: t.id,
				title: t.title,
				statusId: t.statusId,
				priority: t.priority ?? undefined,
				assigneeId: t.assigneeId ?? undefined,
				milestoneId: t.milestoneId ?? undefined,
				milestoneName: t.milestone?.name ?? undefined,
				dueDate: t.dueDate ?? undefined,
				labels: t.labels ?? [],
				checklistSummary: t.checklistSummary
					? {
							total: t.checklistSummary.total ?? 0,
							completed: t.checklistSummary.completed ?? 0,
						}
					: undefined,
			}),
		),
		availableAgents: agents.data.map(
			(a: {
				id: string;
				name: string;
				userId: string;
				description: string | null;
				isActive: boolean;
			}) => ({
				id: a.id,
				name: a.name,
				userId: a.userId,
				description: a.description ?? undefined,
				isActive: a.isActive,
			}),
		),
		teamMembers: members.map(
			(m: { id: string; name: string | null; email: string | null }) => ({
				id: m.id,
				name: m.name ?? "Unknown",
				email: m.email ?? undefined,
			}),
		),
		statuses: teamStatuses.map(
			(s: { id: string; name: string; type: string | null }) => ({
				id: s.id,
				name: s.name,
				type: s.type ?? undefined,
			}),
		),
		executionMemory: execution?.memory ?? undefined,
		trigger,
	};

	return pmContext;
}

// ─── PM agent identity resolution ───────────────────────────────────────────

async function resolvePMAgent({
	project,
	teamId,
}: {
	project: Awaited<ReturnType<typeof getProjectById>>;
	teamId: string;
}): Promise<{
	pmAgent: Awaited<ReturnType<typeof getAgentById>> | null;
	pmUserId: string;
}> {
	// 1. If project has a lead who is an agent, use that
	if (project.leadId) {
		const isAgent = await isSystemUser(project.leadId);
		if (isAgent) {
			const agent = await getAgentByUserId({
				userId: project.leadId,
				teamId,
			});
			if (agent) {
				return { pmAgent: agent, pmUserId: agent.userId };
			}
		}
	}

	// 2. Fallback to first active agent
	const agents = await getAgents({ teamId, isActive: true, pageSize: 1 });
	if (agents.data.length > 0) {
		const firstAgent = agents.data[0]!;
		const agentFull = await getAgentById({ id: firstAgent.id, teamId });
		if (agentFull) {
			return { pmAgent: agentFull, pmUserId: agentFull.userId };
		}
	}

	// 3. Fallback to system user
	const systemUser = await getSystemUser();
	if (!systemUser) {
		throw new Error("System user not found for PM agent");
	}
	return { pmAgent: null, pmUserId: systemUser.id };
}

// ─── Trigger message builder ────────────────────────────────────────────────

function buildTriggerMessage(trigger: ProjectManagerTrigger): string {
	switch (trigger.type) {
		case "task_status_changed":
			return `A task (ID: ${trigger.taskId}) has moved from "${trigger.oldStatus}" to "${trigger.newStatus}" (type: ${trigger.newStatusType}). Review this change and take appropriate action.`;

		case "task_completed":
			return `Task "${trigger.taskTitle}" (ID: ${trigger.taskId}) has been completed. Assess the impact on milestones and decide next steps for the project.`;

		case "milestone_completed":
			return `Milestone "${trigger.milestoneName}" (ID: ${trigger.milestoneId}) is now complete! Review overall project progress and plan the next phase.`;

		case "agent_mention":
			return `@${trigger.mentionedByUserName} mentioned you on task (ID: ${trigger.taskId}):\n"${trigger.message}"\nRespond to their question and take action if needed.`;

		case "project_created":
			return "This project was just created. Analyze the project description and milestones, create an initial plan, and set up tasks to drive the first milestone.";

		case "manual":
			return trigger.instruction
				? `Manual instruction: ${trigger.instruction}`
				: "Review the current project state and take any needed actions.";
	}
}
