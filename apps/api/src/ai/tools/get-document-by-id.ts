import { getDocumentById } from "@mimir/db/queries/documents";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const getDocumentByIdToolSchema = z.object({
	id: z.string().describe("Document ID (uuid)"),
});

export const getDocumentByIdTool = tool({
	description:
		"Get the full content of a document by ID. Documents are a shared knowledge base — they can contain skills, guides, procedures, and reference material for agents, businesses, and humans.",
	inputSchema: getDocumentByIdToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { teamId } = getToolContext(executionOptions);

			const document = await getDocumentById({
				id: input.id,
				teamId,
			});

			if (!document) {
				yield { type: "text", text: "Document not found." };
				return;
			}

			yield document;
		} catch (error) {
			console.error("Error in getDocumentByIdTool:", error);
			throw error;
		}
	},
});
