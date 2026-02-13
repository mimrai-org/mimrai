import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import { db } from "..";
import { agentMemories } from "../schema";

export type AgentMemoryCategory =
	| "lesson"
	| "preference"
	| "fact"
	| "procedure";

export interface CreateAgentMemoryInput {
	agentId: string;
	teamId: string;
	category?: AgentMemoryCategory;
	title: string;
	content: string;
	tags?: string[];
	sourceTaskId?: string;
}

export interface UpdateAgentMemoryInput {
	id: string;
	title?: string;
	content?: string;
	category?: AgentMemoryCategory;
	tags?: string[];
	relevanceScore?: number;
}

/**
 * Create a new memory entry for an agent.
 */
export const createAgentMemory = async (input: CreateAgentMemoryInput) => {
	const [row] = await db
		.insert(agentMemories)
		.values({
			agentId: input.agentId,
			teamId: input.teamId,
			category: input.category ?? "lesson",
			title: input.title,
			content: input.content,
			tags: input.tags ?? [],
			sourceTaskId: input.sourceTaskId,
		})
		.returning();
	return row;
};

/**
 * Retrieve memories for an agent, with optional filtering.
 */
export const getAgentMemories = async ({
	agentId,
	teamId,
	category,
	tags,
	query,
	limit = 50,
}: {
	agentId: string;
	teamId: string;
	category?: AgentMemoryCategory;
	tags?: string[];
	/** Keyword search across title and content (case-insensitive) */
	query?: string;
	limit?: number;
}) => {
	const conditions: SQL[] = [
		eq(agentMemories.agentId, agentId),
		eq(agentMemories.teamId, teamId),
	];

	if (category) {
		conditions.push(eq(agentMemories.category, category));
	}

	// Filter memories that contain at least one of the requested tags
	if (tags && tags.length > 0) {
		conditions.push(
			sql`${agentMemories.tags} && ARRAY[${sql.join(
				tags.map((t) => sql`${t}`),
				sql`, `,
			)}]::text[]`,
		);
	}

	// Keyword search across title and content
	if (query && query.trim().length > 0) {
		const pattern = `%${query.trim()}%`;
		conditions.push(
			sql`(${agentMemories.title} ILIKE ${pattern} OR ${agentMemories.content} ILIKE ${pattern})`,
		);
	}

	return db
		.select()
		.from(agentMemories)
		.where(and(...conditions))
		.orderBy(desc(agentMemories.relevanceScore), desc(agentMemories.updatedAt))
		.limit(limit);
};

/**
 * Update an existing memory entry (e.g. refine content or bump relevance).
 */
export const updateAgentMemory = async (input: UpdateAgentMemoryInput) => {
	const updates: Record<string, unknown> = {
		updatedAt: new Date().toISOString(),
	};

	if (input.title !== undefined) updates.title = input.title;
	if (input.content !== undefined) updates.content = input.content;
	if (input.category !== undefined) updates.category = input.category;
	if (input.tags !== undefined) updates.tags = input.tags;
	if (input.relevanceScore !== undefined)
		updates.relevanceScore = input.relevanceScore;

	const [row] = await db
		.update(agentMemories)
		.set(updates)
		.where(eq(agentMemories.id, input.id))
		.returning();
	return row;
};

/**
 * Delete a memory entry by ID.
 */
export const deleteAgentMemory = async (id: string) => {
	await db.delete(agentMemories).where(eq(agentMemories.id, id));
};

/**
 * Bump the relevance score of a memory (the agent found it useful again).
 */
export const bumpAgentMemoryRelevance = async (id: string) => {
	const [row] = await db
		.update(agentMemories)
		.set({
			relevanceScore: sql`${agentMemories.relevanceScore} + 1`,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(agentMemories.id, id))
		.returning();
	return row;
};
