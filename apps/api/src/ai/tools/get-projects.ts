import { getProjects } from "@db/queries/projects";
import { getAppUrl } from "@mimir/utils/envs";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const getProjectsToolSchema = z.object({
	search: z.string().optional().describe("Search query"),
	cursor: z.string().optional().describe("Pagination cursor"),
	pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
});

export const getProjectsTool = tool({
	description: "Retrieve a list of projects",
	inputSchema: getProjectsToolSchema,
	execute: async function* ({ search, cursor, pageSize }, executionOptions) {
		try {
			const { userId, teamId } =
				executionOptions.experimental_context as AppContext;

			const result = await getProjects({
				teamId: teamId,
				cursor,
				pageSize,
				search,
			});

			if (result.data.length === 0) {
				yield { type: "text", text: "No projects found." };
				return;
			}

			const mappedData = result.data.map((project) => ({
				id: project.id,
				name: project.name,
				description: project.description,
				progress: project.progress,
				color: project.color,
				createdAt: project.createdAt,
				updatedAt: project.updatedAt,
				url: `${getAppUrl()}/dashboard/projects/${project.id}`,
			}));

			yield {
				data: mappedData,
			};
		} catch (error) {
			console.error("Error in getProjectsTool:", error);
			throw error;
		}
	},
});
