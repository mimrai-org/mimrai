import NotificationEmail from "@mimir/email/emails/notification";
import { getAppUrl } from "@mimir/utils/envs";
import { getTaskMarkdownLink } from "@mimir/utils/tasks";
import type { NotificationHandler } from "@notifications/base";

export const taskComment: NotificationHandler = {
	createNotification: (data, user) => {
		return {
			title: "Task Commented",
			message: `> **${user.name}** commented on task **${getTaskMarkdownLink(
				data.groupId!,
				data.metadata?.title,
				data.teamId,
			)}**:\n\n>${data.metadata?.comment}`,
			type: "customer",
			additionalRecipients: data.metadata?.subscribers ?? [],
		};
	},
	createEmail: (data, user, team) => {
		return {
			subject: `New Comment on Task: ${data.metadata?.title}`,
			react: NotificationEmail({
				message: `${user.name} commented on task "${data.metadata?.title}": ${data.metadata?.comment}`,
				teamName: team.name,
				title: "New Comment on Task",
				ctaLink: `${getAppUrl()}`,
			}),
			emailType: "customer",
			additionalRecipients: data.metadata?.subscribers ?? [],
			data,
		};
	},
	createWhatsappNotification: (data, user) => {
		return {
			message: `*${user.name}* commented on task *${data.metadata?.title}*:\n\n${data.metadata?.comment}`,
			type: "customer",
			additionalRecipients: data.metadata?.subscribers ?? [],
		};
	},
};
