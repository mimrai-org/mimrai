import { deleteDocument } from "@mimir/db/queries/documents";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const deleteDocumentToolSchema = z.object({
	id: z.string().describe("Document ID (uuid) to delete"),
});

export const deleteDocumentTool = tool({
	description:
		"Delete a document and all its children from the knowledge base. This is a destructive operation — all nested child documents will also be deleted.",
	inputSchema: deleteDocumentToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { teamId } = getToolContext(executionOptions);

			const document = await deleteDocument({
				id: input.id,
				teamId,
			});

			yield {
				type: "text",
				text: `Document deleted: ${document.name}`,
			};
		} catch (error) {
			console.error("Error deleting document:", error);
			yield {
				type: "text",
				text: "Error deleting document. Ensure you are providing a valid document ID.",
			};
		}
	},
});
