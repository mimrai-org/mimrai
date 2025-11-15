// import { checklistItems } from "@db/schema";
// import { getTaskUrl } from "@mimir/utils/tasks";
// import { tool } from "ai";
// import { and, eq } from "drizzle-orm";
// import z from "zod";
// import { getContext } from "../context";

// export const getSubtasksToolSchema = z.object({
// 	taskId: z.string(),
// });

// export const getSubtasksTool = tool({
// 	description: "Get subtasks for a specific task",
// 	inputSchema: getSubtasksToolSchema,
// 	execute: async function* (input) {
// 		const { db, user } = getContext();

// 		yield { text: "Retrieving subtasks..." };

// 		const data = await db
// 			.select({
// 				id: checklistItems.id,
// 				description: checklistItems.description,
// 				isCompleted: checklistItems.isCompleted,
// 				assigneeId: checklistItems.assigneeId,
// 			})
// 			.from(checklistItems)
// 			.where(
// 				and(
// 					eq(checklistItems.taskId, input.taskId),
// 					eq(checklistItems.teamId, user.teamId),
// 				),
// 			);

// 		yield {
// 			text: `Found ${data.length} subtasks.`,
// 			taskUrl: getTaskUrl(input.taskId, user.teamId),
// 			data,
// 		};
// 	},
// });
