import { tasks, triggers } from "@mimir/db/schema";
import {
	isSystemTriggerType,
	SYSTEM_TRIGGER_TYPES,
} from "@mimir/utils/system-triggers";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { getDb } from "../../init";
import { createTaskFromTemplateJob } from "./create-task-from-template-job";

export const dispatchTriggerTemplatesJob = schemaTask({
	id: "dispatch-trigger-templates-job",
	schema: z.object({
		teamId: z.string(),
		source: z.enum(["system", "db"]),
		triggerType: z.string(),
	}),
	run: async (payload) => {
		const db = getDb();

		if (payload.source === "system") {
			if (!isSystemTriggerType(payload.triggerType)) {
				throw new Error(
					`Unknown system trigger type "${payload.triggerType}". Supported: ${SYSTEM_TRIGGER_TYPES.join(", ")}`,
				);
			}
		}

		const rows = await db
			.select({ id: tasks.id })
			.from(tasks)
			.innerJoin(triggers, eq(tasks.triggerId, triggers.id))
			.where(
				and(
					eq(tasks.teamId, payload.teamId),
					eq(tasks.isTemplate, true),
					eq(triggers.teamId, payload.teamId),
					eq(triggers.type, payload.triggerType),
				),
			);
		const templateIds = rows.map((row) => row.id);

		for (const templateTaskId of templateIds) {
			await createTaskFromTemplateJob.trigger({
				templateTaskId,
				teamId: payload.teamId,
				source: payload.source,
				triggerType: payload.triggerType,
			});
		}

		logger.info(
			`Dispatched ${templateIds.length} template task instantiations for team ${payload.teamId} (${payload.source}:${payload.triggerType}).`,
		);
	},
});
