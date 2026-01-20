import type { NotificationHandler } from "@notifications/base";

export const dailyTeamSummary: NotificationHandler = {
	createNotification: (data, user) => {
		return {
			title: "Daily Team Summary",
			message: data.metadata?.content,
			type: "team",
		};
	},
	createWhatsappNotification: (data, user) => {
		return {
			message: data.metadata?.content,
			type: "team",
		};
	},
};
