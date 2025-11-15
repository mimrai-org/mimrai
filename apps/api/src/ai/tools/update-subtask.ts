// import { updateChecklistItem } from "@db/queries/checklists";
// import { tool } from "ai";
// import z from "zod";
// import { getContext } from "../context";

// export const updateSubtaskToolSchema = z.object({
//   id: z.string().describe("The ID of the subtask to update"),
//   description: z
//     .string()
//     .optional()
//     .describe("The new description of the subtask, if updating"),
//   isCompleted: z
//     .boolean()
//     .optional()
//     .describe("The completion status of the subtask, if completed"),
//   assigneeId: z
//     .string()
//     .optional()
//     .describe("The ID of the user to assign the subtask to, if updating"),
// });

// export const updateSubtaskTool = tool({
//   description:
//     "Update a specific subtask. If the ID is missing get it from getSubtasks tool",
//   inputSchema: updateSubtaskToolSchema,
//   execute: async function* (input) {
//     const { db, user } = getContext();

//     const data = await updateChecklistItem({
//       id: input.id,
//       description: input.description,
//       isCompleted: input.isCompleted,
//       assigneeId: input.assigneeId,
//       teamId: user.teamId,
//     });

//     yield {F
//       text: "Subtask updated successfully.",
//       data,
//     };
//   },
// });
