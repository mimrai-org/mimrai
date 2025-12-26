import {
	createProjectHealthUpdateSchema,
	getProjectHealthUpdatesSchema,
	updateProjectHealthUpdateSchema,
} from "@api/schemas/project-health-updates";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createProjectHealthUpdate,
	deleteProjectHealthUpdate,
	getLatestProjectHealthUpdate,
	getProjectHealthUpdateById,
	getProjectHealthUpdates,
	updateProjectHealthUpdate,
} from "@mimir/db/queries/project-health-updates";
import z from "zod";

export const projectHealthUpdatesRouter = router({
	get: protectedProcedure
		.input(getProjectHealthUpdatesSchema)
		.query(async ({ ctx, input }) => {
			return getProjectHealthUpdates({
				...input,
				teamId: ctx.user.teamId,
			});
		}),

	getLatest: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			return getLatestProjectHealthUpdate({
				teamId: ctx.user.teamId,
				projectId: input.projectId,
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			return getProjectHealthUpdateById({
				id: input.id,
				teamId: ctx.user.teamId,
			});
		}),

	create: protectedProcedure
		.input(createProjectHealthUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			return createProjectHealthUpdate({
				projectId: input.projectId,
				health: input.health,
				summary: input.summary,
				teamId: ctx.user.teamId,
				createdBy: ctx.user.id,
			});
		}),

	update: protectedProcedure
		.input(updateProjectHealthUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			return updateProjectHealthUpdate({
				...input,
				teamId: ctx.user.teamId,
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return deleteProjectHealthUpdate({
				id: input.id,
				teamId: ctx.user.teamId,
			});
		}),
});
