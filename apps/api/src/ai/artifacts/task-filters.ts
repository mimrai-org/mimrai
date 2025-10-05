import { artifact } from "@ai-sdk-tools/artifacts";
import z from "zod";

export const taskFiltersArtifact = artifact(
	"task-filters",
	z.object({
		search: z.string().optional(),
		assigneeId: z.array(z.string()).optional(),
	}),
);
