// import { createChecklistItem } from "@db/queries/checklists";
// import { tool } from "ai";
// import z from "zod";
// import { getContext } from "../context";

// export const createSubtaskToolSchema = z.object({
//   taskId: z
//     .string()
//     .describe(
//       "The ID of the parent task to which the subtask belongs. Must be a valid task ID, if not provided try to get it from getTasks tool."
//     ),
//   description: z
//     .string()
//     .optional()
//     .describe("The new description of the subtask, if updating"),
//   assigneeId: z
//     .string()
//     .optional()
//     .describe("The ID of the user to assign the subtask to, if updating"),
//   attachments: z
//     .array(z.string())
//     .optional()
//     .describe("Array of attachment URLs to associate with the subtask, if any"),
// });

// export const createSubtaskTool = tool({
//   description: "Create a new subtask",
//   inputSchema: createSubtaskToolSchema,
//   execute: async function* (input) {
//     const { db, user } = getContext();

//     const data = await createChecklistItem({
//       description: input.description,
//       assigneeId: input.assigneeId,
//       teamId: user.teamId,
//       taskId: input.taskId,
//       attachments: input.attachments,
//     });

//     yield {
//       text: "Subtask created successfully.",
//       data,
//     };
//   },
// });
