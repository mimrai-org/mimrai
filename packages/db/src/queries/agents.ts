import { and, eq, type SQL, sql } from "drizzle-orm";
import { db } from "..";
import { agents, documents, documentsOnAgents, users } from "../schema";

export const getAgents = async ({
	teamId,
	isActive,
	pageSize = 20,
	cursor,
}: {
	teamId?: string;
	isActive?: boolean;
	pageSize?: number;
	cursor?: string;
}) => {
	const whereClause: SQL[] = [];
	if (teamId) whereClause.push(eq(agents.teamId, teamId));
	if (isActive !== undefined) whereClause.push(eq(agents.isActive, isActive));

	const offset = cursor ? Number.parseInt(cursor, 10) : 0;

	const query = db
		.select()
		.from(agents)
		.where(and(...whereClause))
		.orderBy(agents.createdAt)
		.limit(pageSize)
		.offset(offset);

	const data = await query;

	// Calculate next cursor
	const nextCursor =
		data && data.length === pageSize
			? (offset + pageSize).toString()
			: undefined;

	return {
		meta: {
			cursor: nextCursor ?? null,
			hasPreviousPage: offset > 0,
			hasNextPage: data && data.length === pageSize,
		},
		data,
	};
};

export const getAgentById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	if (!id) return null;

	const whereClause: SQL[] = [eq(agents.id, id)];
	if (teamId) whereClause.push(eq(agents.teamId, teamId));

	const [agent] = await db
		.select()
		.from(agents)
		.where(and(...whereClause))
		.limit(1);

	return agent;
};

export const getAgentByUserId = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(agents.userId, userId)];
	if (teamId) whereClause.push(eq(agents.teamId, teamId));

	const [agent] = await db
		.select()
		.from(agents)
		.where(and(...whereClause))
		.limit(1);

	return agent;
};

export const createAgent = async (input: {
	teamId: string;
	name: string;
	email?: string;
	description?: string;
	avatar?: string;
	behalfUserId?: string;
	activeToolboxes?: string[];
	isActive?: boolean;
	model?: string;
	soul?: string;
}) => {
	return await db.transaction(async (tx) => {
		const [systemUser] = await tx
			.insert(users)
			.values({
				id: crypto.randomUUID(),
				name: input.name,
				isSystemUser: true,
				isMentionable: true,
				image: input.avatar,
				teamId: input.teamId,
				email: input.email ?? `${crypto.randomUUID()}@mimrai.com`,
				createdAt: new Date(),
				emailVerified: true,
				updatedAt: new Date(),
			})
			.returning();

		if (!systemUser) {
			throw new Error("Failed to create system user for agent");
		}

		const [agent] = await tx
			.insert(agents)
			.values({
				...input,
				userId: systemUser.id,
			})
			.returning();

		if (!agent) {
			throw new Error("Failed to create agent");
		}

		return agent;
	});
};

export const updateAgent = async ({
	id,
	teamId,
	...input
}: {
	id: string;
	teamId?: string;
	name?: string;
	description?: string;
	behalfUserId?: string;
	activeToolboxes?: string[];
	avatar?: string;
	isActive?: boolean;
	model?: string;
	soul?: string;
}) => {
	return await db.transaction(async (tx) => {
		const whereClause: SQL[] = [eq(agents.id, id)];
		if (teamId) whereClause.push(eq(agents.teamId, teamId));

		const [agent] = await db
			.update(agents)
			.set(input)
			.where(and(...whereClause))
			.returning();

		if (!agent) {
			throw new Error("Failed to update agent");
		}

		await tx
			.update(users)
			.set({ name: input.name, image: input.avatar })
			.where(eq(users.id, agent.userId));

		return agent;
	});
};

export const deleteAgent = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	return await db.transaction(async (tx) => {
		const whereClause: SQL[] = [eq(agents.id, id)];
		if (teamId) whereClause.push(eq(agents.teamId, teamId));

		const [agent] = await tx
			.delete(agents)
			.where(and(...whereClause))
			.returning();

		if (!agent) {
			throw new Error("Failed to delete agent");
		}

		await tx
			.delete(agents)
			.where(and(...whereClause))
			.returning();

		await tx.delete(users).where(eq(users.id, agent.userId));

		if (!agent) {
			throw new Error("Failed to delete agent");
		}

		return agent;
	});
};

export const getDocumentsForAgent = async ({
	agentId,
	teamId,
}: {
	agentId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(documentsOnAgents.agentId, agentId)];
	if (teamId) {
		whereClause.push(eq(agents.teamId, teamId));
	}

	return await db
		.select({
			id: documents.id,
			name: documents.name,
			icon: documents.icon,
		})
		.from(documentsOnAgents)
		.innerJoin(documents, eq(documentsOnAgents.documentId, documents.id))
		.innerJoin(agents, eq(documentsOnAgents.agentId, agents.id))
		.where(and(...whereClause));
};

export const addDocumentToAgent = async ({
	agentId,
	documentId,
	teamId,
}: {
	agentId: string;
	documentId: string;
	teamId?: string;
}) => {
	if (teamId) {
		const agent = await db
			.select()
			.from(agents)
			.where(and(eq(agents.id, agentId), eq(agents.teamId, teamId)))
			.limit(1);
		if (!agent.length) {
			throw new Error("Agent not found or does not belong to the team");
		}

		const document = await db
			.select()
			.from(documents)
			.where(and(eq(documents.id, documentId), eq(documents.teamId, teamId)))
			.limit(1);
		if (!document.length) {
			throw new Error("Document not found or does not belong to the team");
		}
	}

	return await db
		.insert(documentsOnAgents)
		.values({ agentId, documentId })
		.returning();
};

export const removeDocumentFromAgent = async ({
	agentId,
	documentId,
	teamId,
}: {
	agentId: string;
	documentId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [
		eq(documentsOnAgents.agentId, agentId),
		eq(documentsOnAgents.documentId, documentId),
	];
	if (teamId) {
		whereClause.push(
			sql`EXISTS (SELECT 1 FROM ${agents} WHERE ${agents.id} = ${documentsOnAgents.agentId} AND ${agents.teamId} = ${teamId})`,
		);
	}

	return await db
		.delete(documentsOnAgents)
		.where(and(...whereClause))
		.returning();
};
