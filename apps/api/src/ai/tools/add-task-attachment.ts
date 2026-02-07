import { createAdminClient } from "@api/lib/supabase";
import { getTaskById, updateTask } from "@mimir/db/queries/tasks";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const addTaskAttachmentToolSchema = z.object({
	taskId: z.string().describe("ID of the task to attach the file to"),
	fileName: z
		.string()
		.min(1)
		.describe(
			"Name of the file to upload with the extension (e.g., 'document.pdf')",
		),
	fileContent: z.string().describe("File content in plain text"),
});

export const addTaskAttachmentTool = tool({
	description: "Upload a file and attach it to a task",
	inputSchema: addTaskAttachmentToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, behalfUserId, teamId } = getToolContext(executionOptions);

			const supabase = await createAdminClient();

			const fileBuffer = Buffer.from(input.fileContent);

			const { data, error } = await supabase.storage
				.from("vault")
				.upload(
					`${behalfUserId}/${input.taskId}/${input.fileName}`,
					fileBuffer,
					{
						cacheControl: "3600",
					},
				);

			if (error) {
				throw error;
			}

			const fileUrl = supabase.storage.from("vault").getPublicUrl(data.path)
				.data.publicUrl;

			const task = await getTaskById(input.taskId);

			await updateTask({
				id: input.taskId,
				teamId,
				userId: behalfUserId,
				attachments: [...task.attachments, fileUrl],
			});

			yield {
				url: fileUrl,
				fileName: input.fileName,
				uploadedAt: new Date().toISOString(),
			};
		} catch (error) {
			console.error("Failed to upload file:", error);
			throw new Error(`Failed to upload file: ${error}`);
		}
	},
});
