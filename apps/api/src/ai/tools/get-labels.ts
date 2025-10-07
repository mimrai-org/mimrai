import { labels } from "@db/schema";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import z from "zod";
import { getContext } from "../context";

export const getLabelsToolSchema = z.object({});

export const getLabelsTool = tool({
	description: "Get labels for your tasks",
	inputSchema: getLabelsToolSchema,
	execute: async function* (input) {
		const { db, user } = getContext();

		yield { text: "Retrieving labels..." };

		const data = await db
			.select({
				id: labels.id,
				name: labels.name,
				description: labels.description,
			})
			.from(labels)
			.where(eq(labels.teamId, user.teamId));

		yield {
			text: `Found ${data.length} labels.`,
			data,
		};
	},
});
