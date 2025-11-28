import type { NotificationHandler } from "@notifications/base";

export const followUp: NotificationHandler = {
	createNotification: (data, user) => {
		return {
			title: "Follow-Up",
			message: `${data.metadata?.message}`,
			type: "customer",
			additionalRecipients: [],
		};
	},
	createWhatsappNotification: (data, user) => {
		return {
			message: `${data.metadata?.message}`,
			type: "customer",
			additionalRecipients: [],
		};
	},
};
