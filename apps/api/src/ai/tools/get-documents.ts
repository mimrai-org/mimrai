import { getDocuments } from "@mimir/db/queries/documents";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const getDocumentsToolSchema = z.object({
	search: z
		.string()
		.optional()
		.describe("Full-text search across document names and content"),
	parentId: z
		.string()
		.nullable()
		.optional()
		.describe(
			"Parent document ID to list children. Pass null for root documents only.",
		),
	labels: z.array(z.string()).optional().describe("Filter by label IDs"),
	pageSize: z.number().min(1).max(100).default(20).describe("Page size"),
	cursor: z.string().optional().describe("Pagination cursor"),
});

export const getDocumentsTool = tool({
	description:
		"Search and list documents. Documents are files/folders forming a knowledge base — they contain skills, guides, procedures, and reference material that everyone (agents and humans) can read. Use search to find documents by content.",
	inputSchema: getDocumentsToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { teamId } = getToolContext(executionOptions);

			const result = await getDocuments({
				teamId,
				parentId: input.parentId,
				search: input.search,
				labels: input.labels,
				pageSize: input.pageSize,
				cursor: input.cursor,
			});

			if (result.data.length === 0) {
				yield { type: "text", text: "No documents found." };
				return;
			}

			yield result.data.map((doc) => ({
				id: doc.id,
				name: doc.name,
				content: doc.content
					? doc.content.length > 500
						? `${doc.content.slice(0, 500)}…`
						: doc.content
					: null,
				parentId: doc.parentId,
				labels: doc.labels,
				childrenCount: doc.children.length,
				createdAt: doc.createdAt,
				updatedAt: doc.updatedAt,
			}));
		} catch (error) {
			console.error("Error in getDocumentsTool:", error);
			throw error;
		}
	},
});
