import { columns } from "@db/schema";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import z from "zod";
import { getContext } from "../context";

export const getColumnsToolSchema = z.object({});

export const getColumnsTool = tool({
	description: "Get columns from your task manager",
	inputSchema: getColumnsToolSchema,
	execute: async function* (input) {
		const { db, user } = getContext();

		yield { text: "Retrieving columns..." };

		const data = await db
			.select({
				id: columns.id,
				name: columns.name,
			})
			.from(columns)
			.where(eq(columns.teamId, user.teamId));

		yield {
			text: `Found ${data.length} columns.`,
			data,
		};
	},
});
