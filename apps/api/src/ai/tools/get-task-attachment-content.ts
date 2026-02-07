import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const getTaskAttachmentContentToolSchema = z.object({
	taskId: z.string().describe("ID of the task to attach the file to"),
	attachmentUrl: z.string().describe("URL of the attachment to retrieve"),
});

export const getTaskAttachmentContentTool = tool({
	description: "Retrieve the content of a file attached to a task",
	inputSchema: getTaskAttachmentContentToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, behalfUserId, teamId } = getToolContext(executionOptions);

			const file = await fetch(input.attachmentUrl);
			const fileBuffer = await file.arrayBuffer();
			const content = Buffer.from(fileBuffer).toString("utf-8");

			if (content.length > 100000) {
				yield {
					content: `The is too large or it's content is compressed. Please download it directly from the following link: ${input.attachmentUrl}`,
				};
				return;
			}

			yield {
				content: content,
			};
		} catch (error) {
			console.error("Failed to retrieve file content:", error);
			throw new Error(`Failed to retrieve file content: ${error}`);
		}
	},
});
