import type { NotificationHandler } from "@notifications/base";

export const mention: NotificationHandler = {
  createNotification: (data, user) => {
    return {
      title: "Mentioned in Task",
      message: `> You have been mentioned in ${data.source} **${data.metadata?.title}** by ${user.name}.`,
      type: "customer",
      additionalRecipients: [data.metadata?.mentionedUserId],
    };
  },
  createWhatsappNotification: (data, user) => {
    return {
      message: `You have been mentioned in ${data.source} *${data.metadata?.title}* by ${user.name}.`,
      type: "customer",
      additionalRecipients: [data.metadata?.mentionedUserId],
    };
  },
};
