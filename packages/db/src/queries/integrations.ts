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
}: {
  type: IntegrationName;
  config: IntegrationConfig;
  teamId: string;
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
}: {
  type: IntegrationName;
  teamId?: string;
}) => {
  const whereClause: SQL[] = [eq(integrations.type, type)];
  if (teamId) whereClause.push(eq(integrations.teamId, teamId));

  return await db
    .select()
    .from(integrations)
    .where(and(...whereClause));
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
  teamId,
  cursor,
  pageSize = 20,
}: {
  integrationId: string;
  teamId?: string;
  cursor?: string;
  pageSize?: number;
}) => {
  const whereClause: SQL[] = [
    eq(integrationUserLink.integrationId, integrationId),
  ];

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
      type: integrations.type,
      name: integrations.name,
      createdAt: integrationUserLink.createdAt,
    })
    .from(integrationUserLink)
    .where(and(...whereClause))
    .innerJoin(
      integrations,
      eq(integrationUserLink.integrationId, integrations.id)
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
  teamId,
}: {
  integrationId?: string;
  externalUserId: string;
  teamId?: string;
}) => {
  const whereClause: SQL[] = [
    eq(integrationUserLink.externalUserId, externalUserId),
  ];
  if (integrationId)
    whereClause.push(eq(integrationUserLink.integrationId, integrationId));

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
      eq(integrationUserLink.integrationId, integrations.id)
    )
    .limit(1);

  return link;
};

export const getLinkedUserByUserId = async ({
  integrationId,
  userId,
  teamId,
}: {
  integrationId: string;
  userId: string;
  teamId?: string;
}) => {
  const whereClause: SQL[] = [
    eq(integrationUserLink.integrationId, integrationId),
    eq(integrationUserLink.userId, userId),
  ];

  if (teamId) whereClause.push(eq(integrations.teamId, teamId));

  const [link] = await db
    .select({
      id: integrationUserLink.id,
      externalUserId: integrationUserLink.externalUserId,
      externalUserName: integrationUserLink.externalUserName,
    })
    .from(integrationUserLink)
    .where(and(...whereClause))
    .innerJoin(
      integrations,
      eq(integrationUserLink.integrationId, integrations.id)
    )
    .limit(1);

  return link;
};
