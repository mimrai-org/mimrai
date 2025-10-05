import { artifact } from "@ai-sdk-tools/artifacts";
import z from "zod";
import { priorityEnum } from "@/db/schema/schemas";

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
