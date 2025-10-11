import z from "zod/v3";

export const integrationsRegistry = {
	mattermost: {
		name: "Mattermost",
		type: "mattermost" as const,
		description: "Open-source messaging platform",
		configSchema: z.object({
			token: z.string().min(1, "Token ID is required"),
			url: z.string().url("Invalid URL"),
		}),
	},
	github: {
		name: "GitHub",
		type: "github" as const,
		description: "GitHub integration",
		configSchema: z.object({
			token: z.string().min(1, "Token ID is required"),
			installationId: z.string().min(1, "Installation ID is required"),
		}),
	},
} as const;

export type IntegrationName = keyof typeof integrationsRegistry;
export type IntegrationConfig<T extends IntegrationName = IntegrationName> =
	z.infer<(typeof integrationsRegistry)[T]["configSchema"]>;
export type IntegrationConfigSchema<
	T extends IntegrationName = IntegrationName,
> = (typeof integrationsRegistry)[T]["configSchema"];
