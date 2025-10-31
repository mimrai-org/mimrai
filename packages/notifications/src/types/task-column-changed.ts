import NotificationEmail from "@mimir/email/emails/notification";
import { getAppUrl } from "@mimir/utils/envs";
import { getTaskMarkdownLink } from "@mimir/utils/tasks";
import type { NotificationHandler } from "@notifications/base";

export const taskColumnChanged: NotificationHandler = {
  createNotification: (data, user) => {
    return {
      title: "Task Moved",
      message: `> Task **${getTaskMarkdownLink(
        data.groupId!,
        data.metadata?.title
      )}** has been moved to **${data.metadata?.toColumnName}** by ${
        user.name
      }.`,
      type: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
    };
  },
  createEmail: (data, user, team) => {
    return {
      subject: `Task Moved: ${data.metadata?.title}`,
      react: NotificationEmail({
        message: `Task "${data.metadata?.title}" has been moved to ${data.metadata?.toColumnName}.`,
        teamName: team.name,
        title: "Task Moved",
        ctaLink: `${getAppUrl()}`,
      }),
      emailType: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
      data,
    };
  },
  createWhatsappNotification: (data, user) => {
    return {
      message: `Task *${data.metadata?.title}* has been moved to *${data.metadata?.toColumnName}* by ${user.name}.`,
      type: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
    };
  },
};
