import { createInbox } from "@mimir/db/queries/inbox";
import { getStatuses } from "@mimir/db/queries/statuses";
import { type DecodedEmail, processEmail } from "@mimir/integration/gmail";
import { logger, schemaTask } from "@trigger.dev/sdk";
import z from "zod";

export const processUserEmailJob = schemaTask({
	id: "process-user-email",
	schema: z.object({
		decodedEmail: z.custom<DecodedEmail>(),
		userId: z.string(),
		teamId: z.string(),
	}),
	run: async ({ decodedEmail, userId, teamId }) => {
		const output = await processEmail({ decodedEmail, teamId });

		logger.log(
			`Processed email ${decodedEmail.id}, found ${output.object.tasksPayload.length} tasks`,
			output.object,
		);

		const { data: statuses } = await getStatuses({
			pageSize: 5,
			type: ["to_do", "backlog"],
			teamId,
		});

		const status = statuses.find((s) => s.type === "to_do") || statuses[0];

		if (!status) {
			throw new Error("No status found for creating tasks");
		}

		const promises = [];
		for (const payload of output.object.tasksPayload) {
			promises.push(
				createInbox({
					userId,
					teamId,
					assigneeId: payload.assigneeId,
					display: `${decodedEmail.from} - ${decodedEmail.subject}`,
					source: "gmail",
					sourceId: decodedEmail.id,
					reasoning: payload.reasoning,
					metadata: {
						messageId: decodedEmail.id,
						from: decodedEmail.from,
						to: decodedEmail.to,
						subject: decodedEmail.subject,
						date: decodedEmail.date,
					},
					payload: {
						...payload,
						teamId: teamId,
						statusId: status.id,
					},
				}),
			);
		}

		await Promise.all(promises);
	},
});
