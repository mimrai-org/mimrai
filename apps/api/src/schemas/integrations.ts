import {
  type IntegrationConfig,
  integrationsRegistry,
} from "@mimir/integration/registry";
import z from "zod/v4";

export const installIntegrationSchema = z.object({
  type: z.literal(
    Object.keys(integrationsRegistry) as Array<
      keyof typeof integrationsRegistry
    >
  ),
  config: z.custom<IntegrationConfig>(),
});

export const getIntegrationsSchema = z.object({
  type: z
    .literal(
      Object.keys(integrationsRegistry) as Array<
        keyof typeof integrationsRegistry
      >
    )
    .optional(),
});

export const getIntegrationByTypeSchema = z.object({
  type: z.literal(
    Object.keys(integrationsRegistry) as Array<
      keyof typeof integrationsRegistry
    >
  ),
});

export const validateIntegrationSchema = z.object({
  type: z.literal(
    Object.keys(integrationsRegistry) as Array<
      keyof typeof integrationsRegistry
    >
  ),
  config: z.custom<IntegrationConfig>(),
});

export const associateMattermostUserSchema = z.object({
  integrationId: z.string(),
  mattermostUserId: z.string(),
  mattermostUserName: z.string(),
});

export const associeteIntegrationUserSchema = z.object({
  integrationId: z.string().optional(),
  integrationType: z.string().optional(),
  externalUserId: z.string(),
  externalUserName: z.string(),
});

export const getIntegrationLogsSchema = z.object({
  integrationId: z.string(),
  cursor: z.string().optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

export const getIntegrationByIdSchema = z.object({
  id: z.string(),
});

export const updateIntegrationSchema = z.object({
  id: z.string(),
  config: z.custom<IntegrationConfig>(),
});

export const getLinkedUsersSchema = z.object({
  integrationId: z.string(),
  cursor: z.string().optional(),
  pageSize: z.number().min(1).max(100).optional(),
});
