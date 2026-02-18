import { updateDocument } from "@mimir/db/queries/documents";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const updateDocumentToolSchema = z.object({
	id: z.string().describe("Document ID (uuid) to update"),
	name: z.string().min(1).optional().describe("New document name"),
	content: z
		.string()
		.optional()
		.describe(
			"New document content. Should be helpful, instructive or educative.",
		),
	parentId: z
		.string()
		.nullable()
		.optional()
		.describe("New parent document ID. Pass null to move to root."),
	labels: z
		.array(z.string())
		.optional()
		.describe("Replace labels with this array of label IDs (uuid)"),
});

export const updateDocumentTool = tool({
	description:
		"Update an existing document. Documents are a shared knowledge base — update content to keep information accurate and useful for agents, business and humans.",
	inputSchema: updateDocumentToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId } = getToolContext(executionOptions);

			const document = await updateDocument({
				id: input.id,
				name: input.name,
				content: input.content,
				parentId: input.parentId,
				labels: input.labels,
				teamId,
				updatedBy: userId,
			});

			yield {
				type: "text",
				text: `Document updated: ${document.name}`,
				documentId: document.id,
			};
		} catch (error) {
			console.error("Error updating document:", error);
			yield {
				type: "text",
				text: "Error updating document. Ensure you are providing a valid document ID.",
			};
		}
	},
});
