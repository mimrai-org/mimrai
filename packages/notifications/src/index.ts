import {
  getIntegrationByType,
  getLinkedUsers,
} from "@mimir/db/queries/integrations";
import type { NotificationChannel } from "@mimir/db/queries/notification-settings";
import { getMembers, getTeamById } from "@mimir/db/queries/teams";
import { sendMattermostNotification } from "@mimir/integration/mattermost";
import { getEmailFrom } from "@mimir/utils/envs";
import snakecaseKeys from "snakecase-keys";
import type { UserData } from "./base";
import { resend } from "./lib/resend";
import * as handlers from "./types";

const snakeHandlers = snakecaseKeys(
  { ...handlers },
  {
    deep: false,
  }
);

export const sendNotification = async (
  type: keyof typeof snakeHandlers,
  channel: NotificationChannel,
  data: any,
  user: UserData
) => {
  const handler = snakeHandlers[type as keyof typeof snakeHandlers];

  if (!handler) {
    throw new Error(`No handler found for notification type: ${type}`);
  }

  const notification = handler.createNotification(data, user);

  switch (channel) {
    case "mattermost": {
      const team = await getTeamById(user.teamId);
      if (!team) {
        throw new Error(`Team not found: ${user.teamId}`);
      }
      const recipients = new Set<string>();
      if (notification.type === "customer") {
        recipients.add(user.id);
      }

      if (notification.type === "team") {
        // Send to team channel
        await sendMattermostNotification({
          teamId: user.teamId,
          message: notification.message,
        });
        break;
      }

      if (notification.type === "owners") {
        const members = await getMembers({ teamId: team.id, role: "owner" });
        for (const member of members) {
          recipients.add(member.id);
        }
      }

      if (notification.additionalRecipients) {
        for (const recipient of notification.additionalRecipients) {
          recipients.add(recipient);
        }
      }

      for (const userId of recipients) {
        try {
          await sendMattermostNotification({
            teamId: user.teamId,
            userId,
            message: notification.message,
          });
        } catch (err) {
          console.error(
            `Failed to send Mattermost notification to user ${userId}:`,
            err
          );
        }
      }
      break;
    }
    case "email": {
      const team = await getTeamById(user.teamId);
      if (!team) {
        throw new Error(`Team not found: ${user.teamId}`);
      }
      if (!handler.createEmail) {
        throw new Error(
          `No email creator found for notification type: ${type}`
        );
      }
      const emailPayload = handler.createEmail(data, user, {
        id: team.id,
        name: team.name,
      });

      const recipients = await getEmailRecipients(emailPayload, user, team);

      if (recipients.size === 0) {
        console.warn(
          `No email recipients found for notification type: ${type}`
        );
        return;
      }

      await resend.emails.send({
        // ...emailPayload,
        subject: emailPayload.subject ?? "",
        react: emailPayload.react,
        text: emailPayload.text,
        html: emailPayload.html,
        cc: emailPayload.cc,
        bcc: emailPayload.bcc,
        headers: emailPayload.headers,
        replyTo: emailPayload.replyTo,
        tags: emailPayload.tags,
        attachments: emailPayload.attachments,
        scheduledAt: emailPayload.scheduledAt,
        to: [...recipients],
        from: getEmailFrom(),
      });
    }
  }
};

const getEmailRecipients = async (
  emailPayload: {
    emailType: "customer" | "team" | "owners";
    additionalRecipients?: string[];
  },
  user: UserData,
  team: { id: string; name: string }
) => {
  const recipients = new Set<string>();
  if (emailPayload.emailType === "customer") {
    recipients.add(user.email);
  }

  const members = await getMembers({ teamId: team.id });

  if (emailPayload.emailType === "team") {
    for (const member of members) {
      recipients.add(member.email);
    }
  }

  if (emailPayload.emailType === "owners") {
    for (const member of members.filter((m) => m.role === "owner")) {
      recipients.add(member.email);
    }
  }

  if (emailPayload.additionalRecipients) {
    for (const recipient of emailPayload.additionalRecipients) {
      const member = members.find((m) => m.id === recipient);
      if (!member) continue;
      recipients.add(member.email);
    }
  }

  return recipients;
};
