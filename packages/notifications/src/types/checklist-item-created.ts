import type { NotificationHandler } from "@notifications/base";

export const checklistItemCreated: NotificationHandler = {
  createNotification: (data, user) => {
    return {
      title: "Checklist Item Created",
      message: `> A new checklist item on task **${data.metadata?.title}** has been created by ${user.name}.`,
      type: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
    };
  },
  createWhatsappNotification: (data, user) => {
    return {
      message: `A new checklist item on task *${data.metadata?.title}* has been created by ${user.name}.`,
      type: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
    };
  },
};
