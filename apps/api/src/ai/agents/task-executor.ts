import { openai } from "@ai-sdk/openai";
import type {
	TaskExecutionMemory,
	TaskExecutionPlanStep,
} from "@mimir/db/schema";
import type { IntegrationName } from "@mimir/integration/registry";
import { generateText, Output, stepCountIs } from "ai";
import { z } from "zod";
import {
	getFormattedToolsForPrompt,
	getIntegrationTools,
	researchTools,
	taskManagementTools,
} from "../tools/tool-registry";
import { type AppContext, COMMON_AGENT_RULES } from "./config/shared";

/**
 * Task Executor Agent - Autonomous task execution by AI agent
 *
 * This agent is designed to:
 * - Analyze tasks assigned to the agent and understand their context
 * - Create execution plans with risk assessment
 * - Execute plans step by step with proper error handling
 * - Communicate progress and ask questions via task comments
 * - Delegate work to humans when needed via checklist items
 * - Schedule follow-ups to ensure task completion
 */

export interface TaskExecutorContext extends AppContext {
	/** The task assigned to the agent for execution */
	task: {
		id: string;
		title: string;
		description?: string;
		status?: string;
		statusId?: string;
		priority?: string;
		assignee?: string;
		assigneeId?: string;
		project?: string;
		projectId?: string;
		milestone?: string;
		milestoneId?: string;
		dueDate?: string;
		labels?: Array<{ id: string; name: string }>;
		checklistItems?: Array<{
			id: string;
			description: string;
			isCompleted: boolean;
			assigneeId?: string;
		}>;
	};
	/** Task activities/comments for context */
	activities?: Array<{
		userId: string;
		userName: string;
		type: string;
		content?: string;
		createdAt: string;
	}>;
	/** Current execution memory/state */
	executionMemory?: TaskExecutionMemory;
	/** Current execution plan if exists */
	currentPlan?: TaskExecutionPlanStep[];
	/** Allowed actions based on team policy */
	allowedActions?: string[];
	/** Actions requiring confirmation */
	alwaysConfirmActions?: string[];
	/** Enabled integrations for dynamic tool availability */
	enabledIntegrations?: IntegrationName[];
}

/**
 * Schema for task analysis output (standalone analysis)
 */
const taskAnalysisSchema = z.object({
	summary: z
		.string()
		.describe("Brief summary of what the task requires the agent to do"),
	requirements: z
		.array(z.string())
		.describe("List of specific requirements extracted from the task"),
	missingInfo: z
		.array(z.string())
		.describe("Information the agent needs but doesn't have"),
	questions: z
		.array(z.string())
		.describe("Questions to ask the task creator/team if needed"),
	canProceed: z
		.boolean()
		.describe("Whether the agent has enough information to create a plan"),
	needsHumanHelp: z
		.array(
			z.object({
				task: z.string().describe("Description of what a human needs to do"),
				reason: z.string().describe("Why the agent cannot do this"),
				suggestedAssignee: z
					.string()
					.describe("Suggested user to assign if known"),
			}),
		)
		.describe("Tasks that require human intervention"),
});

export type TaskAnalysis = z.infer<typeof taskAnalysisSchema>;

/**
 * Schema for combined analysis and plan output (merged operation)
 * This saves ~1,500-2,500 tokens by combining two AI calls into one
 */
const analysisAndPlanSchema = z.object({
	// Analysis section
	analysis: z.object({
		summary: z
			.string()
			.describe("Brief summary of what the task requires the agent to do"),
		requirements: z
			.array(z.string())
			.describe("List of specific requirements extracted from the task"),
		missingInfo: z
			.array(z.string())
			.describe("Information the agent needs but doesn't have"),
		questions: z
			.array(z.string())
			.describe("Questions to ask the task creator/team if needed"),
		canProceed: z
			.boolean()
			.describe("Whether the agent has enough information to create a plan"),
		needsHumanHelp: z
			.array(
				z.object({
					task: z.string().describe("Description of what a human needs to do"),
					reason: z.string().describe("Why the agent cannot do this"),
					suggestedAssignee: z
						.string()
						.describe("Suggested user to assign if known"),
				}),
			)
			.describe("Tasks that require human intervention"),
	}),
	// Plan section (only populated if canProceed is true)
	plan: z
		.object({
			steps: z.array(
				z.object({
					description: z
						.string()
						.describe("Human-readable description of what this step does"),
					action: z
						.string()
						.describe(
							"The tool/action to execute (e.g., createTask, updateTask, webSearch, createChecklistItem)",
						),
					parameters: z
						.array(
							z.object({
								name: z.string().describe("Parameter name"),
								value: z.string().describe("Parameter value"),
							}),
						)
						.nullable()
						.describe("Parameters for the action"),
					riskLevel: z
						.enum(["low", "medium", "high"])
						.describe("Risk level of this action"),
					riskReason: z
						.string()
						.nullable()
						.describe("Explanation if risk is medium or high"),
					dependsOn: z
						.array(z.number())
						.nullable()
						.describe("Indices of steps this step depends on"),
				}),
			),
			estimatedDuration: z
				.string()
				.describe("Estimated time to complete the plan"),
			warnings: z
				.array(z.string())
				.nullable()
				.describe("Any warnings or concerns about the plan"),
		})
		.nullable()
		.describe("Execution plan - null if canProceed is false"),
});

export type AnalysisAndPlan = z.infer<typeof analysisAndPlanSchema>;

/**
 * Schema for execution plan output (standalone planning)
 */
const executionPlanSchema = z.object({
	steps: z.array(
		z.object({
			description: z
				.string()
				.describe("Human-readable description of what this step does"),
			action: z
				.string()
				.describe(
					"The tool/action to execute (e.g., createTask, updateTask, webSearch, createChecklistItem)",
				),
			parameters: z
				.array(
					z.object({
						name: z.string().describe("Parameter name"),
						value: z.string().describe("Parameter value"),
					}),
				)
				.nullable()
				.describe("Parameters for the action"),
			riskLevel: z
				.enum(["low", "medium", "high"])
				.describe("Risk level of this action"),
			riskReason: z
				.string()
				.nullable()
				.describe("Explanation if risk is medium or high"),
			dependsOn: z
				.array(z.number())
				.nullable()
				.describe("Indices of steps this step depends on"),
		}),
	),
	estimatedDuration: z.string().describe("Estimated time to complete the plan"),
	warnings: z
		.array(z.string())
		.nullable()
		.describe("Any warnings or concerns about the plan"),
});

export type ExecutionPlan = z.infer<typeof executionPlanSchema>;

/**
 * Build combined system prompt for analysis + planning in a single call
 * This eliminates context duplication between separate analysis and planning calls
 */
function buildAnalysisAndPlanSystemPrompt(ctx: TaskExecutorContext): string {
	const taskDetails = formatTaskDetails(ctx);
	const activitiesContext = formatActivities(ctx);
	const memoryContext = formatMemory(ctx);
	const allowedActionsText =
		ctx.allowedActions?.join(", ") || "All standard actions";
	const confirmActionsText =
		ctx.alwaysConfirmActions?.join(", ") || "None specified";
	const toolsDescription = getFormattedToolsForPrompt(ctx.enabledIntegrations);

	return `You are an AI assistant analyzing and planning execution for a task assigned to you.

<context>
Team: ${ctx.teamName}
Timezone: ${ctx.timezone}
Current time: ${ctx.currentDateTime}
</context>

<assigned-task>
${taskDetails}
</assigned-task>

<task-activities>
${activitiesContext}
</task-activities>

<execution-memory>
${memoryContext}
</execution-memory>

<policy>
Allowed actions: ${allowedActionsText}
Actions always requiring confirmation: ${confirmActionsText}
</policy>

<available-tools>
${toolsDescription}
</available-tools>

${COMMON_AGENT_RULES}

<analysis-rules>
- Carefully analyze the task title, description, and any comments to understand what needs to be done
- Identify ALL specific requirements and deliverables
- Identify any actionable parts of the task that require human intervention (things you cannot do)
- Consider the context from previous activities and any Q&A history
- Know your capabilities based on the available tools listed above
- Only ask for human help when absolutely necessary - things you truly cannot do with your tools
- Get as much information as possible from context before asking questions
- Don't ask dumb or unnecessary questions, your primary goal is to execute the task autonomously
</analysis-rules>

<planning-rules>
- If you can proceed (have enough info), create a step-by-step execution plan
- Each step should map to a specific tool/action from the available tools list
- Assess the risk level of each step:
  - LOW: Safe operations like reading data, creating comments
  - MEDIUM: Modifications that can be easily undone
  - HIGH: Irreversible actions, external communications, data deletion
- Actions in the "always confirm" list should ALWAYS be marked as HIGH risk UNLESS already confirmed by the user
- Order steps logically, noting dependencies between steps
- Include steps for gathering information before taking actions
- Include a final step to update the task status and leave a completion comment
- Be specific with parameters where possible
- If a step requires human input, create a checklist item and wait for completion

IMPORTANT - Detecting user confirmation from activities:
- Carefully read the task activities/comments to detect if the user has already approved or confirmed the plan
- Confirmations can be in ANY LANGUAGE - look for intent, not specific words
- Examples of confirmation intent: approval, agreement, "go ahead", "proceed", "yes", "do it", thumbs up, etc.
- If the user has confirmed/approved the plan in a comment, mark those steps as LOW risk instead of HIGH
- If the user has rejected specific steps, exclude them from the plan
- If the user asked for modifications, incorporate them into the plan
- A previously proposed plan that received user approval should proceed without requiring re-confirmation
</planning-rules>`;
}

/**
 * Build system prompt for task analysis
 */
function buildAnalysisSystemPrompt(ctx: TaskExecutorContext): string {
	const taskDetails = formatTaskDetails(ctx);
	const activitiesContext = formatActivities(ctx);
	const memoryContext = formatMemory(ctx);
	const toolsDescription = getFormattedToolsForPrompt(ctx.enabledIntegrations);

	return `You are an AI assistant analyzing a task that has been assigned to you for autonomous execution.

<context>
Team: ${ctx.teamName}
Timezone: ${ctx.timezone}
Current time: ${ctx.currentDateTime}
</context>

<assigned-task>
${taskDetails}
</assigned-task>

<task-activities>
${activitiesContext}
</task-activities>

<execution-memory>
${memoryContext}
</execution-memory>

<available-tools>
${toolsDescription}
</available-tools>

${COMMON_AGENT_RULES}

<analysis-rules>
- Carefully analyze the task title, description, and any comments to understand what needs to be done
- Identify ALL specific requirements and deliverables
- Identify any actionable parts of the task that require human intervention (things you cannot do)
- Consider the context from previous activities and any Q&A history
- Know your capabilities based on the available tools listed above
- Only ask for human help when absolutely necessary - things you truly cannot do with your tools
- Get as much information as possible from context before asking questions
- Don't ask dumb or unnecessary questions, your primary goal is to execute the task autonomously
</analysis-rules>`;
}

/**
 * Build system prompt for plan creation
 */
function buildPlanningSystemPrompt(ctx: TaskExecutorContext): string {
	const taskDetails = formatTaskDetails(ctx);
	const activitiesContext = formatActivities(ctx);
	const memoryContext = formatMemory(ctx);
	const allowedActionsText =
		ctx.allowedActions?.join(", ") || "All standard actions";
	const confirmActionsText =
		ctx.alwaysConfirmActions?.join(", ") || "None specified";
	const toolsDescription = getFormattedToolsForPrompt(ctx.enabledIntegrations);

	return `You are an AI assistant creating an execution plan for a task assigned to you.

<context>
Team: ${ctx.teamName}
Timezone: ${ctx.timezone}
Current time: ${ctx.currentDateTime}
</context>

<assigned-task>
${taskDetails}
</assigned-task>

<task-activities>
${activitiesContext}
</task-activities>

<execution-memory>
${memoryContext}
</execution-memory>

<policy>
Allowed actions: ${allowedActionsText}
Actions always requiring confirmation: ${confirmActionsText}
</policy>

${COMMON_AGENT_RULES}

<planning-rules>
- Create a step-by-step plan to complete the task
- Each step should map to a specific tool/action from the available tools list below
- Assess the risk level of each step:
  - LOW: Safe operations like reading data, creating comments
  - MEDIUM: Modifications that can be easily undone
  - HIGH: Irreversible actions, external communications, data deletion
- Actions in the "always confirm" list should ALWAYS be marked as HIGH risk UNLESS already confirmed by the user
- Order steps logically, noting dependencies between steps
- Include steps for gathering information before taking actions
- Include a final step to update the task status and leave a completion comment
- Be specific with parameters where possible
- If a step requires human input, create a checklist item and wait for completion

IMPORTANT - Detecting user confirmation from activities:
- Carefully read the task activities/comments to detect if the user has already approved or confirmed the plan
- Confirmations can be in ANY LANGUAGE - look for intent, not specific words
- Examples of confirmation intent: approval, agreement, "go ahead", "proceed", "yes", "do it", thumbs up, etc.
- If the user has confirmed/approved the plan in a comment, mark those steps as LOW risk instead of HIGH
- If the user has rejected specific steps, exclude them from the plan
- If the user asked for modifications, incorporate them into the plan
- A previously proposed plan that received user approval should proceed without requiring re-confirmation
</planning-rules>

<available-tools>
${toolsDescription}
</available-tools>`;
}

/**
 * Build system prompt for step execution
 */
function buildExecutionSystemPrompt(
	ctx: TaskExecutorContext,
	currentStep: TaskExecutionPlanStep,
): string {
	const taskDetails = formatTaskDetails(ctx);

	return `You are an AI assistant executing step ${currentStep.order + 1} of your execution plan.

<context>
Team: ${ctx.teamName}
Team ID: ${ctx.teamId}
Timezone: ${ctx.timezone}
Current time: ${ctx.currentDateTime}
</context>

<current-task>
${taskDetails}
</current-task>

<current-step>
Description: ${currentStep.description}
Action: ${currentStep.action}
Parameters: ${JSON.stringify(currentStep.parameters || {})}
</current-step>

${COMMON_AGENT_RULES}

<execution-rules>
- Execute ONLY the current step described above
- Use the appropriate tool to complete this step
- If the step cannot be completed, explain why
- Be precise with tool parameters
- Report the result clearly
</execution-rules>`;
}

/**
 * Build prompt for generating confirmation comment
 */
function buildConfirmationCommentPrompt(
	ctx: TaskExecutorContext,
	plan: TaskExecutionPlanStep[],
): string {
	const highRiskSteps = plan.filter((s) => s.riskLevel === "high");
	const mediumRiskSteps = plan.filter((s) => s.riskLevel === "medium");

	return `You are an AI assistant about to post a comment requesting confirmation for your execution plan.

<task>
Title: ${ctx.task.title}
</task>

Plan summary (only use this for context, do not include in the comment):
Total steps: ${plan.length}
High-risk steps requiring confirmation: ${highRiskSteps.length}
Medium-risk steps: ${mediumRiskSteps.length}

Steps needing confirmation:
${highRiskSteps.map((s, i) => `${i + 1}. [Step ${s.order + 1}] ${s.description}\n   Risk reason: ${s.riskReason}`).join("\n")}

<instructions>
Write a clear, professional comment that:
- Briefly summarizes your plan to complete this task
- Lists the steps that need confirmation
- Asks the user to reply with which steps to approve or reject
- Mentions that low-risk steps will proceed automatically
- Uses a friendly but professional tone
- Formats the response for easy reading (use bullet points or numbered lists)
- Respond only with the comment text, no additional explanations
</instructions>`;
}

/**
 * Format task details for prompts
 */
function formatTaskDetails(ctx: TaskExecutorContext): string {
	const task = ctx.task;
	const checklistText =
		task.checklistItems && task.checklistItems.length > 0
			? task.checklistItems
					.map(
						(c) =>
							`- [${c.isCompleted ? "x" : " "}] ${c.description}${c.assigneeId ? " (assigned)" : ""}`,
					)
					.join("\n")
			: "No checklist items";

	return `ID: ${task.id}
Title: ${task.title}
Description: ${task.description || "No description provided"}
Status: ${task.status || "Unknown"} (ID: ${task.statusId || "N/A"})
Priority: ${task.priority || "Not set"}
Project: ${task.project || "No project"} (ID: ${task.projectId || "N/A"})
Milestone: ${task.milestone || "No milestone"} (ID: ${task.milestoneId || "N/A"})
Due Date: ${task.dueDate || "Not set"}
Labels: ${task.labels?.map((l) => l.name).join(", ") || "None"}

Checklist Items:
${checklistText}`;
}

/**
 * Format activities for prompts
 */
function formatActivities(ctx: TaskExecutorContext): string {
	if (!ctx.activities || ctx.activities.length === 0) {
		return "No activities yet.";
	}

	return ctx.activities
		.map((a) => {
			if (a.type === "task_comment" || a.type === "task_comment_reply") {
				return `[${a.createdAt}] ${a.userName}: ${a.content || "(empty comment)"}`;
			}
			return `[${a.createdAt}] ${a.userName}: ${a.type.replace(/_/g, " ")}`;
		})
		.join("\n");
}

/**
 * Format execution memory for prompts
 */
function formatMemory(ctx: TaskExecutorContext): string {
	if (!ctx.executionMemory) {
		return "No previous execution context.";
	}

	const mem = ctx.executionMemory;
	const parts: string[] = [];

	if (mem.taskAnalysis) {
		parts.push(`Previous Analysis: ${mem.taskAnalysis}`);
	}

	if (mem.contextSummary) {
		parts.push(`Context Summary: ${mem.contextSummary}`);
	}

	if (mem.qaPairs && mem.qaPairs.length > 0) {
		const qaText = mem.qaPairs
			.map(
				(qa) =>
					`Q: ${qa.question}\nA: ${qa.answer || `(awaiting answer, asked at ${qa.askedAt})`}`,
			)
			.join("\n\n");
		parts.push(`Questions & Answers:\n${qaText}`);
	}

	if (mem.blockers && mem.blockers.length > 0) {
		const blockersText = mem.blockers
			.map(
				(b) => `- ${b.description} [${b.resolved ? "RESOLVED" : "BLOCKING"}]`,
			)
			.join("\n");
		parts.push(`Blockers:\n${blockersText}`);
	}

	if (mem.humanSubtasks && mem.humanSubtasks.length > 0) {
		const subtasksText = mem.humanSubtasks
			.map((st) => `- ${st.description} [${st.completed ? "DONE" : "PENDING"}]`)
			.join("\n");
		parts.push(`Human Subtasks:\n${subtasksText}`);
	}

	if (mem.notes && mem.notes.length > 0) {
		parts.push(`Notes:\n${mem.notes.map((n) => `- ${n}`).join("\n")}`);
	}

	return parts.length > 0
		? parts.join("\n\n")
		: "No previous execution context.";
}

/**
 * Analyze a task to understand what needs to be done
 */
export async function analyzeTask(
	ctx: TaskExecutorContext,
): Promise<TaskAnalysis> {
	const result = await generateText({
		model: openai("gpt-4o"),
		system: buildAnalysisSystemPrompt(ctx),
		prompt: `Analyze the assigned task and determine what needs to be done.
Return a structured analysis including:
- Summary of the task requirements
- Any missing information
- Questions you need to ask
- Whether you can proceed with planning
- Any parts requiring human help`,
		output: Output.object({
			schema: taskAnalysisSchema,
		}),
	});

	if (!result.output) {
		throw new Error("Failed to generate task analysis");
	}

	return result.output;
}

/**
 * Create an execution plan for a task
 */
export async function createExecutionPlan(
	ctx: TaskExecutorContext,
	analysis: TaskAnalysis,
): Promise<TaskExecutionPlanStep[]> {
	const result = await generateText({
		model: openai("gpt-4o"),
		system: buildPlanningSystemPrompt(ctx),
		prompt: `Based on the task analysis, create a detailed execution plan.

Previous analysis summary: ${analysis.summary}
Requirements: ${analysis.requirements.join(", ")}
${analysis.needsHumanHelp.length > 0 ? `Note: Some parts need human help: ${analysis.needsHumanHelp.map((h) => h.task).join(", ")}` : ""}

Create a step-by-step plan that:
1. Gathers any needed information
2. Performs the required actions
3. Handles human delegation where needed
4. Updates the task status upon completion`,
		output: Output.object({
			schema: executionPlanSchema,
		}),
	});

	if (!result.output) {
		throw new Error("Failed to generate execution plan");
	}

	// Convert to TaskExecutionPlanStep format with IDs
	return result.output.steps.map((step, index) => ({
		id: crypto.randomUUID(),
		order: index,
		description: step.description,
		action: step.action,
		parameters: step.parameters as
			| { name: string; value: unknown }[]
			| undefined,
		riskLevel: step.riskLevel,
		riskReason: step.riskReason,
		status: "pending" as const,
	}));
}

/**
 * Generate a confirmation comment for high-risk steps
 */
export async function generateConfirmationComment(
	ctx: TaskExecutorContext,
	plan: TaskExecutionPlanStep[],
): Promise<string> {
	const result = await generateText({
		model: openai("gpt-4o-mini"),
		system: buildConfirmationCommentPrompt(ctx, plan),
		prompt: "Generate the confirmation comment to post on the task.",
	});

	return result.text;
}

/**
 * Execute a single plan step
 */
export async function executeStep(
	ctx: TaskExecutorContext,
	step: TaskExecutionPlanStep,
): Promise<{ success: boolean; result?: string; error?: string }> {
	try {
		const result = await generateText({
			model: openai("gpt-4o"),
			experimental_context: ctx,
			system: buildExecutionSystemPrompt(ctx, step),
			prompt: `Execute this step: ${step.description}`,
			stopWhen: stepCountIs(10),
			tools: {
				...taskManagementTools,
				...researchTools,
				...getIntegrationTools(ctx.enabledIntegrations),
			},
		});

		return {
			success: true,
			result: result.text || "Step completed successfully",
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Generate a progress/completion comment
 */
export async function generateProgressComment(
	ctx: TaskExecutorContext,
	message: string,
): Promise<string> {
	const result = await generateText({
		model: openai("gpt-4o-mini"),
		system: `You are an AI assistant posting a progress update on a task you're working on.
Keep it brief and professional. Task: "${ctx.task.title}"`,
		prompt: `Write a brief comment for this update: ${message}`,
	});

	return result.text;
}

/**
 * Determine if a plan has high-risk steps requiring confirmation
 */
export function planRequiresConfirmation(
	plan: TaskExecutionPlanStep[],
): boolean {
	return plan.some((step) => step.riskLevel === "high");
}

/**
 * Get pending high-risk steps that need confirmation
 */
export function getPendingHighRiskSteps(
	plan: TaskExecutionPlanStep[],
): TaskExecutionPlanStep[] {
	return plan.filter(
		(step) => step.riskLevel === "high" && step.status === "pending",
	);
}

/**
 * Check if plan is ready to execute (all high-risk steps confirmed)
 */
export function isPlanReadyToExecute(plan: TaskExecutionPlanStep[]): boolean {
	const highRiskSteps = plan.filter((step) => step.riskLevel === "high");
	return highRiskSteps.every(
		(step) => step.status === "confirmed" || step.status === "rejected",
	);
}

/**
 * Get the next executable step in the plan
 */
export function getNextExecutableStep(
	plan: TaskExecutionPlanStep[],
): TaskExecutionPlanStep | null {
	return (
		plan.find(
			(step) =>
				step.status === "pending" ||
				(step.status === "confirmed" && step.riskLevel === "high"),
		) ?? null
	);
}

// =============================================================================
// OPTIMIZED FUNCTIONS - Token-efficient merged operations
// =============================================================================

/**
 * Combined analysis and planning in a single AI call
 *
 * This function merges analyzeTask() and createExecutionPlan() into one call,
 * eliminating context duplication and saving ~1,500-2,500 tokens per execution.
 *
 * @returns Analysis with optional plan (plan is null if canProceed is false)
 */
export async function analyzeAndPlan(ctx: TaskExecutorContext): Promise<{
	analysis: TaskAnalysis;
	plan: TaskExecutionPlanStep[] | null;
	estimatedDuration?: string;
	warnings?: string[];
}> {
	const result = await generateText({
		model: openai("gpt-4o"),
		system: buildAnalysisAndPlanSystemPrompt(ctx),
		prompt: `Analyze the assigned task and create an execution plan.

Step 1 - Analysis:
- Understand what the task requires
- Identify all requirements and deliverables
- Determine if you have enough information to proceed
- Note any questions or human help needed

Step 2 - Planning (if you can proceed):
- Create a detailed step-by-step execution plan
- Map each step to available tools
- Assess risk levels for each step
- Note dependencies between steps

If you cannot proceed (missing critical info), set canProceed to false and provide questions.
If you can proceed, include the full execution plan.`,
		output: Output.object({
			schema: analysisAndPlanSchema,
		}),
	});

	if (!result.output) {
		throw new Error("Failed to generate analysis and plan");
	}

	const { analysis, plan } = result.output;

	// Convert analysis to TaskAnalysis type
	const taskAnalysis: TaskAnalysis = {
		summary: analysis.summary,
		requirements: analysis.requirements,
		missingInfo: analysis.missingInfo,
		questions: analysis.questions,
		canProceed: analysis.canProceed,
		needsHumanHelp: analysis.needsHumanHelp,
	};

	// If no plan, return just the analysis
	if (!plan) {
		return { analysis: taskAnalysis, plan: null };
	}

	// Convert plan steps to TaskExecutionPlanStep format with IDs
	const planSteps: TaskExecutionPlanStep[] = plan.steps.map((step, index) => ({
		id: crypto.randomUUID(),
		order: index,
		description: step.description,
		action: step.action,
		parameters: step.parameters as
			| { name: string; value: unknown }[]
			| undefined,
		riskLevel: step.riskLevel,
		riskReason: step.riskReason,
		status: "pending" as const,
	}));

	return {
		analysis: taskAnalysis,
		plan: planSteps,
		estimatedDuration: plan.estimatedDuration,
		warnings: plan.warnings ?? undefined,
	};
}

/**
 * Build system prompt for unified plan execution
 * This replaces the per-step buildExecutionSystemPrompt with a plan-aware version
 */
function buildPlanExecutionSystemPrompt(
	ctx: TaskExecutorContext,
	plan: TaskExecutionPlanStep[],
	completedSteps: TaskExecutionPlanStep[],
): string {
	const taskDetails = formatTaskDetails(ctx);

	const completedStepsText =
		completedSteps.length > 0
			? completedSteps
					.map(
						(s) =>
							`✓ Step ${s.order + 1}: ${s.description}${s.result ? `\n  Result: ${s.result}` : ""}`,
					)
					.join("\n")
			: "None yet";

	const pendingSteps = plan.filter(
		(s) =>
			s.status === "pending" ||
			(s.status === "confirmed" && s.riskLevel === "high"),
	);
	const pendingStepsText =
		pendingSteps.length > 0
			? pendingSteps
					.map(
						(s) =>
							`○ Step ${s.order + 1}: ${s.description} [${s.action}] (${s.riskLevel} risk)`,
					)
					.join("\n")
			: "All steps completed";

	return `You are an AI assistant executing a plan to complete an assigned task.

<context>
Team: ${ctx.teamName}
Team ID: ${ctx.teamId}
Timezone: ${ctx.timezone}
Current time: ${ctx.currentDateTime}
</context>

<current-task>
${taskDetails}
</current-task>

<completed-steps>
${completedStepsText}
</completed-steps>

<pending-steps>
${pendingStepsText}
</pending-steps>

${COMMON_AGENT_RULES}

<execution-rules>
- Execute the pending steps IN ORDER
- Use the appropriate tools to complete each step
- Consider results from completed steps when executing subsequent steps
- If a step fails, stop and report the error
- After completing all steps, report the final summary
- Be precise with tool parameters
- Do NOT skip steps or execute out of order
- If a step depends on previous results, use those results
</execution-rules>`;
}

/**
 * Execute entire plan with a single agentic loop
 *
 * This replaces calling executeStep() N times with a single AI agent that
 * processes all steps while maintaining awareness of completed work.
 * Saves significant tokens by not re-sending system context for each step.
 *
 * @param ctx - Task executor context
 * @param plan - Full execution plan (will filter to executable steps)
 * @param onStepComplete - Optional callback when each step completes
 * @returns Execution result with updated plan steps
 */
export async function executePlan(
	ctx: TaskExecutorContext,
	plan: TaskExecutionPlanStep[],
	onStepComplete?: (step: TaskExecutionPlanStep) => Promise<void>,
): Promise<{
	success: boolean;
	completedSteps: TaskExecutionPlanStep[];
	failedStep?: TaskExecutionPlanStep;
	error?: string;
	summary?: string;
}> {
	// Filter to only executable steps (pending or confirmed high-risk)
	const executableSteps = plan.filter(
		(s) =>
			s.status === "pending" ||
			(s.status === "confirmed" && s.riskLevel === "high"),
	);

	// Skip rejected steps
	const rejectedSteps = plan.filter((s) => s.status === "rejected");

	if (executableSteps.length === 0) {
		return {
			success: true,
			completedSteps: plan.filter((s) => s.status === "completed"),
			summary: "No executable steps remaining",
		};
	}

	// Track completed steps for context
	const completedSteps: TaskExecutionPlanStep[] = plan.filter(
		(s) => s.status === "completed",
	);

	// Build the execution prompt with current step info
	const stepsToExecute = executableSteps
		.map(
			(s, i) =>
				`${i + 1}. [Step ${s.order + 1}] ${s.description}\n   Action: ${s.action}\n   Parameters: ${JSON.stringify(s.parameters || {})}`,
		)
		.join("\n\n");

	try {
		const result = await generateText({
			model: openai("gpt-4o"),
			experimental_context: ctx,
			system: buildPlanExecutionSystemPrompt(ctx, plan, completedSteps),
			prompt: `Execute the following steps in order:

${stepsToExecute}

${rejectedSteps.length > 0 ? `\nNote: The following steps were rejected by the user and should be SKIPPED:\n${rejectedSteps.map((s) => `- Step ${s.order + 1}: ${s.description}`).join("\n")}` : ""}

Execute each step using the appropriate tools. After completing all steps, provide a summary of what was accomplished.`,
			stopWhen: stepCountIs(executableSteps.length * 3 + 5), // Allow for multi-tool steps + buffer
			tools: {
				...taskManagementTools,
				...researchTools,
				...getIntegrationTools(ctx.enabledIntegrations),
			},
		});

		// Mark all executable steps as completed
		for (const step of executableSteps) {
			step.status = "completed";
			step.result = "Completed as part of plan execution";
			completedSteps.push(step);

			if (onStepComplete) {
				await onStepComplete(step);
			}
		}

		return {
			success: true,
			completedSteps,
			summary: result.text || "Plan executed successfully",
		};
	} catch (error) {
		// On error, we don't know exactly which step failed
		// Mark first pending step as failed
		const failedStep = executableSteps[0];
		if (failedStep) {
			failedStep.status = "failed";
			failedStep.error =
				error instanceof Error ? error.message : "Unknown error";
		}

		return {
			success: false,
			completedSteps,
			failedStep,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
