import { db } from "@mimir/db/client";
import { statuses } from "@mimir/db/schema";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const getStatusesToolSchema = z.object({});

export const getStatusesTool = tool({
	description: "Get statuses from your task manager",
	inputSchema: getStatusesToolSchema,
	execute: async function* (input, executionOptions) {
		const { userId, teamId } =
			executionOptions.experimental_context as AppContext;

		const data = await db
			.select({
				id: statuses.id,
				name: statuses.name,
			})
			.from(statuses)
			.where(eq(statuses.teamId, teamId));

		yield {
			text: `Found ${data.length} statuses.`,
			data,
		};
	},
});
