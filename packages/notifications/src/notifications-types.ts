import type { NotificationChannel } from "@mimir/db/queries/notification-settings";

export interface NotificationType {
	type: string;
	channels: NotificationChannel[];
	showInSettings: boolean;
	category?: string;
	order?: number;
}

export const allNotificationTypes: NotificationType[] = [
	{
		type: "task_assigned",
		channels: ["email", "mattermost"],
		showInSettings: true,
		category: "tasks",
		order: 2,
	},
	{
		type: "task_column_changed",
		channels: ["email", "mattermost"],
		showInSettings: true,
		category: "tasks",
		order: 3,
	},
	{
		type: "task_comment",
		channels: ["email", "mattermost"],
		showInSettings: true,
		category: "tasks",
		order: 4,
	},
	{
		type: "resume_generated",
		channels: ["mattermost"],
		showInSettings: true,
		category: "resumes",
		order: 1,
	},
	{
		type: "daily_digest",
		channels: ["mattermost", "whatsapp"],
		showInSettings: true,
		category: "resumes",
		order: 2,
	},
	{
		type: "daily_eod",
		channels: ["mattermost", "whatsapp"],
		showInSettings: true,
		category: "resumes",
		order: 3,
	},
	{
		type: "mention",
		channels: ["mattermost"],
		showInSettings: true,
		order: 1,
	},
	{
		type: "follow_up",
		channels: ["mattermost", "whatsapp"],
		showInSettings: true,
		category: "tasks",
		order: 7,
	},
	{
		type: "checklist_item_created",
		channels: ["mattermost"],
		showInSettings: true,
		category: "tasks",
		order: 5,
	},
	{
		type: "checklist_item_completed",
		channels: ["mattermost"],
		showInSettings: true,
		category: "tasks",
		order: 6,
	},
];

// Get all notification types (including hidden ones)
export function getAllNotificationTypes(): NotificationType[] {
	return allNotificationTypes;
}

// Get only notification types that should appear in user settings
export function getUserSettingsNotificationTypes(): NotificationType[] {
	return allNotificationTypes.filter((type) => type.showInSettings);
}

// Get a specific notification type by its type string
export function getNotificationTypeByType(
	typeString: string,
): NotificationType | undefined {
	return allNotificationTypes.find((type) => type.type === typeString);
}

// Check if a notification type should appear in settings
export function shouldShowInSettings(typeString: string): boolean {
	const notificationType = getNotificationTypeByType(typeString);
	return notificationType?.showInSettings ?? false;
}

// Get notification types grouped by category
export interface NotificationCategory {
	category: string;
	order: number;
	types: NotificationType[];
}

export function getNotificationTypesByCategory(): NotificationCategory[] {
	const settingsTypes = getUserSettingsNotificationTypes();
	const categoryMap = new Map<string, NotificationCategory>();

	for (const notificationType of settingsTypes) {
		const category = notificationType.category || "other";
		const order = notificationType.order || 999;

		if (!categoryMap.has(category)) {
			categoryMap.set(category, {
				category,
				order,
				types: [],
			});
		}

		categoryMap.get(category)!.types.push(notificationType);
	}

	// Sort categories by order, then by name
	return Array.from(categoryMap.values()).sort((a, b) => {
		if (a.order !== b.order) {
			return a.order - b.order;
		}
		return a.category.localeCompare(b.category);
	});
}
