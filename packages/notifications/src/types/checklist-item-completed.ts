import type { NotificationHandler } from "@notifications/base";

export const checklistItemCompleted: NotificationHandler = {
  createNotification: (data, user) => {
    return {
      title: "Checklist Item Completed",
      message: `> A checklist item on task **${data.metadata?.title}** has been completed by ${user.name}.`,
      type: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
    };
  },
  createWhatsappNotification: (data, user) => {
    return {
      message: `A checklist item on task *${data.metadata?.title}* has been completed by ${user.name}.`,
      type: "customer",
      additionalRecipients: data.metadata?.subscribers ?? [],
    };
  },
};
