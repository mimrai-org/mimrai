import {
	addProjectMemberSchema,
	createProjectSchema,
	getProjectMembersSchema,
	getProjectsSchema,
	removeProjectMemberSchema,
	updateProjectSchema,
} from "@api/schemas/projects";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	addProjectMember,
	cloneProject,
	createProject,
	deleteProject,
	getProjectById,
	getProjectMembers,
	getProjectProgress,
	getProjects,
	getProjectsForTimeline,
	removeProjectMember,
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
				userId: ctx.user.id,
			});
		}),

	getForTimeline: protectedProcedure.query(async ({ ctx }) => {
		return getProjectsForTimeline({
			teamId: ctx.user.teamId,
			userId: ctx.user.id,
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
				userId: ctx.user.id,
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

	getProgress: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			return getProjectProgress({
				projectId: input.id,
				teamId: ctx.user.teamId,
			});
		}),

	clone: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return cloneProject({
				projectId: input.id,
				teamId: ctx.user.teamId,
				userId: ctx.user.id,
			});
		}),

	// Project members management
	addMember: protectedProcedure
		.input(addProjectMemberSchema)
		.mutation(async ({ ctx, input }) => {
			return addProjectMember({
				projectId: input.projectId,
				userId: input.userId,
				teamId: ctx.user.teamId,
			});
		}),

	removeMember: protectedProcedure
		.input(removeProjectMemberSchema)
		.mutation(async ({ ctx, input }) => {
			return removeProjectMember({
				projectId: input.projectId,
				userId: input.userId,
				teamId: ctx.user.teamId,
			});
		}),

	getMembers: protectedProcedure
		.input(getProjectMembersSchema)
		.query(async ({ ctx, input }) => {
			return getProjectMembers({
				projectId: input.projectId,
				teamId: ctx.user.teamId,
			});
		}),
});
