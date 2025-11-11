import {
	createProjectSchema,
	getProjectsSchema,
	updateProjectSchema,
} from "@api/schemas/projects";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createProject,
	deleteProject,
	getProjectById,
	getProjects,
	updateProject,
} from "@mimir/db/queries/projects";
import z from "zod";

export const projectsRouter = router({
	get: protectedProcedure
		.input(getProjectsSchema.optional())
		.query(async ({ ctx, input }) => {
			return getProjects({
				...input,
				teamId: ctx.user.teamId,
			});
		}),

	create: protectedProcedure
		.input(createProjectSchema)
		.mutation(async ({ ctx, input }) => {
			return createProject({
				...input,
				teamId: ctx.user.teamId,
				userId: ctx.user.id,
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			return getProjectById({
				projectId: input.id,
				teamId: ctx.user.teamId,
			});
		}),

	update: protectedProcedure
		.input(updateProjectSchema)
		.mutation(async ({ ctx, input }) => {
			return updateProject({
				...input,
				teamId: ctx.user.teamId,
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return deleteProject({
				projectId: input.id,
				teamId: ctx.user.teamId,
			});
		}),
});
