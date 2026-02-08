import {
	bumpAgentMemoryRelevance,
	createAgentMemory,
	getAgentMemories,
	updateAgentMemory,
} from "@mimir/db/queries/agent-memories";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";
import type { TaskExecutorContext } from "../agents/task-executor";

/**
 * Resolve the agent ID from the tool execution context.
 * Falls back to `undefined` when the current user is not an agent.
 */
function resolveAgentId(ctx: TaskExecutorContext): string | undefined {
	return (ctx as TaskExecutorContext & { agentId?: string }).agentId;
}

// ── Save a new memory ───────────────────────────────────────────────

export const saveAgentMemoryTool = tool({
	description:
		"Save a new lesson, preference, fact, or procedure to your long-term memory. " +
		"Use this whenever you learn something from a mistake, discover a useful pattern, " +
		"or note a user/team preference. These memories persist across tasks and help you " +
		"avoid repeating mistakes and improve over time.",
	inputSchema: z.object({
		category: z
			.enum(["lesson", "preference", "fact", "procedure"])
			.default("lesson")
			.describe(
				"The type of memory: lesson (learned from mistake/success), " +
					"preference (user/team preference), fact (domain knowledge), " +
					"procedure (step-by-step workflow)",
			),
		title: z
			.string()
			.min(1)
			.describe(
				"Short summary of the memory (e.g. 'Always use ISO dates for API calls')",
			),
		content: z
			.string()
			.min(1)
			.describe(
				"Detailed description of what you learned, including context and why it matters",
			),
		tags: z
			.array(z.string())
			.optional()
			.describe(
				"Tags to help find this memory later (e.g. ['email', 'formatting', 'project-alpha'])",
			),
	}),
	execute: async (input, executionOptions) => {
		const ctx = getToolContext(executionOptions) as TaskExecutorContext;
		const agentId = resolveAgentId(ctx);

		if (!agentId) {
			return { success: false, error: "No agent identity found in context" };
		}

		const memory = await createAgentMemory({
			agentId,
			teamId: ctx.teamId,
			category: input.category,
			title: input.title,
			content: input.content,
			tags: input.tags,
			sourceTaskId: ctx.task?.id,
		});

		return {
			success: true,
			memoryId: memory?.id,
			message: `Memory saved: "${input.title}"`,
		};
	},
});

// ── Recall memories ─────────────────────────────────────────────────

export const recallAgentMemoriesTool = tool({
	description:
		"Search your long-term memory for past lessons, preferences, facts, or procedures. " +
		"Use this at the start of a task or when you encounter something familiar to recall " +
		"what you have learned before. This helps you avoid past mistakes and apply proven patterns.",
	inputSchema: z.object({
		category: z
			.enum(["lesson", "preference", "fact", "procedure"])
			.optional()
			.describe("Filter by memory category"),
		tags: z
			.array(z.string())
			.optional()
			.describe("Filter by tags (returns memories matching any of these tags)"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.optional()
			.default(20)
			.describe("Maximum number of memories to return"),
	}),
	execute: async (input, executionOptions) => {
		const ctx = getToolContext(executionOptions) as TaskExecutorContext;
		const agentId = resolveAgentId(ctx);

		if (!agentId) {
			return {
				success: false,
				memories: [],
				error: "No agent identity found in context",
			};
		}

		const memories = await getAgentMemories({
			agentId,
			teamId: ctx.teamId,
			category: input.category,
			tags: input.tags,
			limit: input.limit,
		});

		return {
			success: true,
			count: memories.length,
			memories: memories.map((m) => ({
				id: m.id,
				category: m.category,
				title: m.title,
				content: m.content,
				tags: m.tags,
				relevanceScore: m.relevanceScore,
				createdAt: m.createdAt,
			})),
		};
	},
});

// ── Update an existing memory ───────────────────────────────────────

export const updateAgentMemoryTool = tool({
	description:
		"Update an existing memory entry — refine its content, change its category, or adjust tags. " +
		"Use this when you have new information that complements or corrects a previous memory.",
	inputSchema: z.object({
		memoryId: z.string().describe("ID of the memory to update"),
		title: z.string().optional().describe("Updated title"),
		content: z.string().optional().describe("Updated content"),
		category: z
			.enum(["lesson", "preference", "fact", "procedure"])
			.optional()
			.describe("Updated category"),
		tags: z
			.array(z.string())
			.optional()
			.describe("Updated tags (replaces existing tags)"),
	}),
	execute: async (input, executionOptions) => {
		getToolContext(executionOptions); // validate context

		const updated = await updateAgentMemory({
			id: input.memoryId,
			title: input.title,
			content: input.content,
			category: input.category,
			tags: input.tags,
		});

		if (!updated) {
			return { success: false, error: "Memory not found" };
		}

		return {
			success: true,
			message: `Memory updated: "${updated.title}"`,
		};
	},
});

// ── Mark a memory as useful (bump relevance) ────────────────────────

export const bumpAgentMemoryRelevanceTool = tool({
	description:
		"Mark a memory as useful because it helped in the current task. " +
		"This increases the memory's relevance score so it appears higher in future recalls.",
	inputSchema: z.object({
		memoryId: z.string().describe("ID of the memory that proved useful"),
	}),
	execute: async (input, executionOptions) => {
		getToolContext(executionOptions); // validate context

		const updated = await bumpAgentMemoryRelevance(input.memoryId);

		if (!updated) {
			return { success: false, error: "Memory not found" };
		}

		return {
			success: true,
			message: `Relevance bumped for: "${updated.title}" (score: ${updated.relevanceScore})`,
		};
	},
});
