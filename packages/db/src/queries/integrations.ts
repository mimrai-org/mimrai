import {
	type IntegrationConfig,
	type IntegrationName,
	integrationsRegistry,
} from "@integration/registry";
import { integrationsCache } from "@mimir/cache/integrations-cache";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "../index";
import {
	integrationLogs,
	integrations,
	integrationUserLink,
	users,
} from "../schema";

export const installIntegration = async ({
	type,
	config,
	teamId,
	externalTeamId,
}: {
	type: IntegrationName;
	config: IntegrationConfig;
	teamId: string;
	externalTeamId?: string;
}) => {
	const registry = integrationsRegistry[type];
	if (!registry) {
		throw new Error("Unsupported integration type");
	}

	const [existing] = await db
		.select()
		.from(integrations)
		.where(and(eq(integrations.type, type), eq(integrations.teamId, teamId)))
		.limit(1);

	if (existing) {
		return existing;
	}

	const installed = await db
		.select()
		.from(integrations)
		.where(and(eq(integrations.type, type), eq(integrations.teamId, teamId)))
		.limit(1);

	if (installed.length > 0) {
		throw new Error("Integration already installed for this team");
	}

	// Validate config against the schema
	const safeConfig = registry.configSchema.safeParse(config);

	if (!safeConfig.success) {
		throw new Error(`Invalid configuration: ${safeConfig.error.message}`);
	}

	const [integration] = await db
		.insert(integrations)
		.values({
			type,
			config: safeConfig.data,
			name: registry.name,
			teamId,
			externalTeamId,
		})
		.returning();

	// await initIntegrationSingle(integration);

	return integration;
};

export const getIntegrations = async ({
	type,
	teamId,
}: {
	type?: IntegrationName;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [];

	if (type) whereClause.push(eq(integrations.type, type));
	if (teamId) whereClause.push(eq(integrations.teamId, teamId));

	return await db
		.select()
		.from(integrations)
		.where(and(...whereClause));
};

export const getIntegrationByType = async ({
	type,
	teamId,
	externalTeamId,
}: {
	type: IntegrationName;
	externalTeamId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(integrations.type, type)];
	if (externalTeamId)
		whereClause.push(eq(integrations.externalTeamId, externalTeamId));
	if (teamId) whereClause.push(eq(integrations.teamId, teamId));

	const [integration] = await db
		.select()
		.from(integrations)
		.where(and(...whereClause));
	return integration;
};

export const getIntegrationById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(integrations.id, id)];
	if (teamId) whereClause.push(eq(integrations.teamId, teamId));

	const [integration] = await db
		.select()
		.from(integrations)
		.where(and(...whereClause))
		.limit(1);

	return integration;
};

export const getIntegrationLogs = async ({
	integrationId,
	teamId,
	cursor,
	pageSize = 20,
}: {
	integrationId: string;
	teamId?: string;
	cursor?: string;
	pageSize?: number;
}) => {
	const whereClause: SQL[] = [eq(integrationLogs.integrationId, integrationId)];

	if (teamId) whereClause.push(eq(integrations.teamId, teamId));

	const query = db
		.select({
			id: integrationLogs.id,
			integrationId: integrations.id,
			type: integrations.type,
			name: integrations.name,
			level: integrationLogs.level,
			message: integrationLogs.message,
			details: integrationLogs.details,
			inputTokens: integrationLogs.inputTokens,
			outputTokens: integrationLogs.outputTokens,
			createdAt: integrationLogs.createdAt,
		})
		.from(integrationLogs)
		.where(and(...whereClause))
		.innerJoin(integrations, eq(integrationLogs.integrationId, integrations.id))
		.orderBy(desc(integrationLogs.createdAt));

	const offset = cursor ? Number.parseInt(cursor, 10) : 0;
	query.limit(pageSize).offset(offset);

	// Execute query
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

export const updateIntegration = async ({
	id,
	config,
	teamId,
}: {
	id: string;
	config: IntegrationConfig;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(integrations.id, id)];
	if (teamId) whereClause.push(eq(integrations.teamId, teamId));

	const [existing] = await db
		.select()
		.from(integrations)
		.where(and(...whereClause))
		.limit(1);

	if (!existing) {
		throw new Error("Integration not found");
	}

	const registry = integrationsRegistry[existing.type as IntegrationName];
	if (!registry) {
		throw new Error("Unsupported integration type");
	}

	// Validate config against the schema
	const safeConfig = registry.configSchema.safeParse(config);

	if (!safeConfig.success) {
		throw new Error(`Invalid configuration: ${safeConfig.error.message}`);
	}

	const [updated] = await db
		.update(integrations)
		.set({ config: safeConfig.data })
		.where(and(...whereClause))
		.returning();

	// If the integration is running, stop it first
	await integrationsCache.publish(id, {
		type: "restart",
		config: safeConfig.data,
	});
	// Re-initialize the integration with the new config
	// await initIntegrationSingle(updated);

	return updated;
};

export const getLinkedUsers = async ({
	integrationId,
	integrationType,
	userId,
	teamId,
	cursor,
	pageSize = 20,
}: {
	integrationId?: string;
	integrationType?: IntegrationName;
	userId?: string;
	teamId?: string;
	cursor?: string;
	pageSize?: number;
}) => {
	const whereClause: SQL[] = [];

	if (integrationType)
		whereClause.push(eq(integrationUserLink.integrationType, integrationType));
	if (integrationId)
		whereClause.push(eq(integrationUserLink.integrationId, integrationId));
	if (userId) whereClause.push(eq(integrationUserLink.userId, userId));
	if (teamId) whereClause.push(eq(integrations.teamId, teamId));

	const query = db
		.select({
			id: integrationUserLink.id,
			externalUserId: integrationUserLink.externalUserId,
			externalUserName: integrationUserLink.externalUserName,
			userId: integrationUserLink.userId,
			user: {
				name: users.name,
				email: users.email,
			},
			integrationId: integrations.id,
			integrationType: integrations.type,
			integrationConfig: integrations.config,
			config: integrationUserLink.config,
			accessToken: integrationUserLink.accessToken,
			refreshToken: integrationUserLink.refreshToken,
			type: integrations.type,
			name: integrations.name,
			teamId: integrations.teamId,
			createdAt: integrationUserLink.createdAt,
		})
		.from(integrationUserLink)
		.where(and(...whereClause))
		.innerJoin(
			integrations,
			eq(integrationUserLink.integrationId, integrations.id),
		)
		.innerJoin(users, eq(integrationUserLink.userId, users.id))
		.orderBy(desc(integrationUserLink.createdAt));

	const offset = cursor ? Number.parseInt(cursor, 10) : 0;
	query.limit(pageSize).offset(offset);

	// Execute query
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

export const getLinkedUserByExternalId = async ({
	integrationId,
	externalUserId,
	integrationType,
	teamId,
}: {
	integrationId?: string;
	integrationType?: IntegrationName;
	externalUserId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [
		eq(integrationUserLink.externalUserId, externalUserId),
	];
	if (integrationId)
		whereClause.push(eq(integrationUserLink.integrationId, integrationId));
	if (integrationType)
		whereClause.push(eq(integrationUserLink.integrationType, integrationType));

	if (teamId) whereClause.push(eq(integrations.teamId, teamId));

	const [link] = await db
		.select({
			id: integrationUserLink.id,
			userId: integrationUserLink.userId,
			externalUserId: integrationUserLink.externalUserId,
		})
		.from(integrationUserLink)
		.where(and(...whereClause))
		.leftJoin(
			integrations,
			eq(integrationUserLink.integrationId, integrations.id),
		)
		.limit(1);

	return link;
};

export const getLinkedUserByUserId = async ({
	integrationId,
	integrationType,
	userId,
	teamId,
}: {
	integrationId?: string;
	integrationType?: IntegrationName;
	userId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(integrationUserLink.userId, userId)];

	if (integrationId)
		whereClause.push(eq(integrationUserLink.integrationId, integrationId));
	if (teamId) whereClause.push(eq(integrations.teamId, teamId));
	if (integrationType)
		whereClause.push(eq(integrationUserLink.integrationType, integrationType));

	const [link] = await db
		.select({
			id: integrationUserLink.id,
			accessToken: integrationUserLink.accessToken,
			refreshToken: integrationUserLink.refreshToken,
			externalUserId: integrationUserLink.externalUserId,
			externalUserName: integrationUserLink.externalUserName,
			config: integrationUserLink.config,
		})
		.from(integrationUserLink)
		.where(and(...whereClause))
		.leftJoin(
			integrations,
			eq(integrationUserLink.integrationId, integrations.id),
		)
		.limit(1);

	return link;
};

export const linkUserToIntegration = async ({
	...input
}: {
	integrationId: string;
	integrationType: IntegrationName;
	userId: string;
	externalUserId: string;
	externalUserName: string;
	accessToken?: string;
	refreshToken?: string;
	config?: Record<string, any>;
}) => {
	const [link] = await db
		.insert(integrationUserLink)
		.values({
			...input,
		})
		.onConflictDoUpdate({
			target: [
				integrationUserLink.integrationId,
				integrationUserLink.userId,
				integrationUserLink.externalUserId,
			],
			set: {
				externalUserName: input.externalUserName,
				accessToken: input.accessToken,
				refreshToken: input.refreshToken,
				config: input.config,
			},
		})
		.returning();

	return link;
};

export const updateLinkedUser = async ({
	userId,
	teamId,
	integrationType,
	...input
}: {
	userId: string;
	teamId: string;
	integrationType: IntegrationName;
	accessToken?: string;
	refreshToken?: string;
	config?: Record<string, any>;
}) => {
	const whereClause: SQL[] = [eq(integrationUserLink.userId, userId)];
	if (teamId) whereClause.push(eq(integrations.teamId, teamId));
	if (integrationType)
		whereClause.push(eq(integrationUserLink.integrationType, integrationType));

	const [existing] = await db
		.select()
		.from(integrationUserLink)
		.innerJoin(
			integrations,
			eq(integrationUserLink.integrationId, integrations.id),
		)
		.where(and(...whereClause))
		.limit(1);

	if (!existing) {
		throw new Error("Linked user not found");
	}

	const [updated] = await db
		.update(integrationUserLink)
		.set({
			...input,
			...(input.config
				? {
						config: {
							...existing.integration_user_link.config,
							...input.config,
						},
					}
				: {}),
		})
		.where(eq(integrationUserLink.id, existing.integration_user_link.id))
		.returning();

	return updated;
};

export const uninstallIntegration = async ({
	type,
	teamId,
}: {
	type: IntegrationName;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(integrations.type, type)];
	if (teamId) whereClause.push(eq(integrations.teamId, teamId));

	const [existing] = await db
		.select()
		.from(integrations)
		.where(and(...whereClause))
		.limit(1);

	if (!existing) {
		throw new Error("Integration not found");
	}

	const [deleted] = await db
		.delete(integrations)
		.where(and(...whereClause))
		.returning();

	if (deleted) {
		await integrationsCache.publish(deleted.id, {
			type: "stop",
		});
	}

	if (!deleted) {
		throw new Error("Failed to uninstall integration");
	}

	await db
		.delete(integrationUserLink)
		.where(eq(integrationUserLink.integrationId, deleted.id));

	return true;
};
