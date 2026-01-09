import { artifact } from "@ai-sdk-tools/artifacts";
import { priorityEnum } from "@mimir/db/schema/schemas";
import z from "zod";

export const taskArtifact = artifact(
	"task",
	z.object({
		id: z.string(),
		title: z.string(),
		description: z.string().nullable(),
		priority: z.enum(priorityEnum.enumValues).nullable(),
	}),
);

export const tasksListArtifact = artifact(
	"tasks-list",
	z.object({
		tasks: z.array(taskArtifact.schema),
	}),
);
