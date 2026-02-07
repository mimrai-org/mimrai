import { and, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "..";
import { integrationUserLink, mcpServers } from "../schema";

export const createMcpServer = async (input: {
	name: string;
	description?: string;
	transport?: "http" | "sse";
	config: { url: string; headers?: Record<string, string>; scopes?: string[] };
	teamId: string;
	createdBy: string;
}) => {
	const [server] = await db.insert(mcpServers).values(input).returning();

	if (!server) {
		throw new Error("Failed to create MCP server");
	}

	return server;
};

export const updateMcpServer = async ({
	id,
	teamId,
	...input
}: {
	id: string;
	teamId: string;
	name?: string;
	description?: string;
	transport?: "http" | "sse";
	config?: { url: string; headers?: Record<string, string>; scopes?: string[] };
	isActive?: boolean;
}) => {
	const [server] = await db
		.update(mcpServers)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(and(eq(mcpServers.id, id), eq(mcpServers.teamId, teamId)))
		.returning();

	if (!server) {
		throw new Error("Failed to update MCP server");
	}

	return server;
};

export const getMcpServerById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const [server] = await db
		.select()
		.from(mcpServers)
		.where(and(eq(mcpServers.id, id), eq(mcpServers.teamId, teamId)))
		.limit(1);

	return server;
};

export const getMcpServers = async ({
	teamId,
	activeOnly,
}: {
	teamId: string;
	activeOnly?: boolean;
}) => {
	const whereClause: SQL[] = [eq(mcpServers.teamId, teamId)];
	if (activeOnly) {
		whereClause.push(eq(mcpServers.isActive, true));
	}

	return db
		.select()
		.from(mcpServers)
		.where(and(...whereClause))
		.orderBy(mcpServers.name);
};

export const deleteMcpServer = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const [server] = await db
		.delete(mcpServers)
		.where(and(eq(mcpServers.id, id), eq(mcpServers.teamId, teamId)))
		.returning();

	if (!server) {
		throw new Error("Failed to delete MCP server");
	}

	return server;
};

/**
 * Get user auth tokens for MCP servers.
 * Returns a map of mcpServerId -> accessToken for all authenticated servers.
 */
export const getMcpServerUserTokens = async ({
	userId,
	mcpServerIds,
}: {
	userId: string;
	mcpServerIds: string[];
}): Promise<Record<string, string>> => {
	if (mcpServerIds.length === 0) return {};

	const links = await db
		.select({
			mcpServerId: integrationUserLink.mcpServerId,
			accessToken: integrationUserLink.accessToken,
		})
		.from(integrationUserLink)
		.where(
			and(
				eq(integrationUserLink.userId, userId),
				inArray(integrationUserLink.mcpServerId, mcpServerIds),
			),
		);

	const tokens: Record<string, string> = {};
	for (const link of links) {
		if (link.mcpServerId && link.accessToken) {
			tokens[link.mcpServerId] = link.accessToken;
		}
	}

	return tokens;
};
