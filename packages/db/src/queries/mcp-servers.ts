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
 * Returns full token info including refresh token and config for expiration checking.
 */
export const getMcpServerUserTokens = async ({
	userId,
	mcpServerIds,
}: {
	userId: string;
	mcpServerIds: string[];
}): Promise<
	Record<
		string,
		{
			accessToken: string;
			refreshToken: string | null;
			config: {
				tokenType?: string;
				expiresIn?: number;
				authenticatedAt?: string;
			} | null;
		}
	>
> => {
	if (mcpServerIds.length === 0) return {};

	const links = await db
		.select({
			mcpServerId: integrationUserLink.mcpServerId,
			accessToken: integrationUserLink.accessToken,
			refreshToken: integrationUserLink.refreshToken,
			config: integrationUserLink.config,
		})
		.from(integrationUserLink)
		.where(
			and(
				eq(integrationUserLink.userId, userId),
				inArray(integrationUserLink.mcpServerId, mcpServerIds),
			),
		);

	const tokens: Record<
		string,
		{
			accessToken: string;
			refreshToken: string | null;
			config: {
				tokenType?: string;
				expiresIn?: number;
				authenticatedAt?: string;
			} | null;
		}
	> = {};
	for (const link of links) {
		if (link.mcpServerId && link.accessToken) {
			tokens[link.mcpServerId] = {
				accessToken: link.accessToken,
				refreshToken: link.refreshToken,
				config: link.config as {
					tokenType?: string;
					expiresIn?: number;
					authenticatedAt?: string;
				} | null,
			};
		}
	}

	return tokens;
};

/**
 * Update the stored tokens for an MCP server user link after a refresh.
 */
export const updateMcpServerUserToken = async ({
	userId,
	mcpServerId,
	accessToken,
	refreshToken,
	config,
}: {
	userId: string;
	mcpServerId: string;
	accessToken: string;
	refreshToken?: string | null;
	config?: Record<string, unknown>;
}) => {
	await db
		.update(integrationUserLink)
		.set({
			accessToken,
			...(refreshToken !== undefined ? { refreshToken } : {}),
			...(config ? { config } : {}),
		})
		.where(
			and(
				eq(integrationUserLink.userId, userId),
				eq(integrationUserLink.mcpServerId, mcpServerId),
			),
		);
};
