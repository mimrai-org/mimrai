import { createDocument } from "@mimir/db/queries/documents";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const createDocumentToolSchema = z.object({
	name: z.string().min(1).describe("Document name / title"),
	content: z
		.string()
		.optional()
		.describe(
			"Document content. Can be plain text, Markdown or HTML. Should be helpful, instructive or educative — think of it as a shared knowledge base entry, not personal notes.",
		),
	parentId: z
		.string()
		.optional()
		.describe("Parent document ID (uuid) for nesting. Omit for root level."),
	labels: z
		.array(z.string())
		.optional()
		.describe("Array of label IDs (uuid) to attach"),
});

export const createDocumentTool = tool({
	description:
		"Create a new document in the shared knowledge base. Documents act as files/folders — they can be nested under a parent document to form a directory structure. Content should be helpful, instructive or educative for agents, business and humans.",
	inputSchema: createDocumentToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId } = getToolContext(executionOptions);

			const document = await createDocument({
				name: input.name,
				content: input.content,
				parentId: input.parentId,
				labels: input.labels,
				teamId,
				createdBy: userId,
			});

			yield {
				type: "text",
				text: `Document created: ${document.name}`,
				documentId: document.id,
			};
		} catch (error) {
			console.error("Error creating document:", error);
			yield {
				type: "text",
				text: "Error creating document. Ensure you are providing valid IDs.",
			};
		}
	},
});
