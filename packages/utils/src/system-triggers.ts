export const systemTriggersRegistry = {
	cron: {
		type: "cron",
		name: "Cron",
		description: "Run tasks from templates on a cron-based schedule.",
	},
} as const;

export type SystemTriggerType = keyof typeof systemTriggersRegistry;

export const SYSTEM_TRIGGER_TYPES = Object.keys(
	systemTriggersRegistry,
) as SystemTriggerType[];

export const isSystemTriggerType = (
	value: string,
): value is SystemTriggerType => {
	return value in systemTriggersRegistry;
};
