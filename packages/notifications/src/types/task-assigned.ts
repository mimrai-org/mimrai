import NotificationEmail from "@mimir/email/emails/notification";
import { getAppUrl } from "@mimir/utils/envs";
import { getTaskMarkdownLink } from "@mimir/utils/tasks";
import type { NotificationHandler } from "@notifications/base";

export const taskAssigned: NotificationHandler = {
  createNotification: (data, user) => {
    return {
      title: "Task Assigned",
      message: `> Task **${getTaskMarkdownLink(
        data.groupId!,
        data.metadata?.title
      )}** has been assigned to **${data.metadata?.assigneeName}**.`,
      type: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
    };
  },
  createEmail: (data, user, team) => {
    return {
      subject: `New Task Assigned: ${data.metadata?.title}`,
      react: NotificationEmail({
        message: `Task "${data.metadata?.title}" has been assigned to ${data.metadata?.assigneeName}.`,
        teamName: team.name,
        title: "Task Assigned",
        ctaLink: `${getAppUrl()}`,
      }),
      emailType: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
      data,
    };
  },
  createWhatsappNotification: (data, user) => {
    return {
      message: `Task *${data.metadata?.title}* has been assigned to *${data.metadata?.assigneeName}*.`,
      type: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
    };
  },
};
