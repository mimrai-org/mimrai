import z from "zod/v3";

export const integrationsRegistry = {
	mattermost: {
		name: "Mattermost",
		type: "mattermost" as const,
		description:
			"Integrate MIMIR with your Mattermost workspace. Create tasks directly from your channels",
		configSchema: z.object({
			token: z.string().min(1, "Token ID is required"),
			url: z.string().url("Invalid URL"),
			teamNotificationChannelId: z.string().optional(),
		}),
	},
	github: {
		name: "GitHub",
		type: "github" as const,
		description: "Integrate MIMIR with your GitHub repositories.",
		configSchema: z.object({
			installationId: z.string().min(1, "Installation ID is required"),
		}),
	},
	whatsapp: {
		name: "WhatsApp",
		type: "whatsapp" as const,
		description:
			"Chat with MIMIR on WhatsApp. Create tasks directly from your chats",
		configSchema: z.object({}),
	},
	slack: {
		name: "Slack",
		type: "slack" as const,
		description:
			"Chat with MIMIR on Slack. Create tasks directly from your workspace",
		configSchema: z.object({
			accessToken: z.string(),
		}),
	},
	"google-calendar": {
		name: "Google Calendar",
		type: "google-calendar" as const,
		description: "Sync your tasks with Google Calendar. Never miss a deadline",
		configSchema: z.object({}),
	},
	gmail: {
		name: "Gmail",
		type: "gmail" as const,
		description: "Intake tasks directly from your Gmail inbox",
		configSchema: z.object({
			filters: z
				.object({
					sendersWhitelist: z.array(z.string().email()).optional(),
					sendersBlacklist: z.array(z.string().email()).optional(),
					subjectMatching: z.string().optional(),
					bodyMatching: z.string().optional(),
				})
				.optional(),
		}),
	},
} as const;

export type IntegrationName = keyof typeof integrationsRegistry;
export type IntegrationConfig<T extends IntegrationName = IntegrationName> =
	z.infer<(typeof integrationsRegistry)[T]["configSchema"]>;
export type IntegrationConfigSchema<
	T extends IntegrationName = IntegrationName,
> = (typeof integrationsRegistry)[T]["configSchema"];
