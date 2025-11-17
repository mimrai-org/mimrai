import type { NotificationHandler } from "@notifications/base";

export const dailyEndOfDay: NotificationHandler = {
	createNotification: (data, user) => {
		return {
			title: "Daily End of Day Summary",
			message: data.metadata?.content,
			type: "customer",
		};
	},
	createWhatsappNotification: (data, user) => {
		return {
			message: data.metadata?.content,
			type: "customer",
		};
	},
};
