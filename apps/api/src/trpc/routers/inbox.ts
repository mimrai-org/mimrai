import {
	createInboxSchema,
	deleteInboxSchema,
	getInboxByIdSchema,
	getInboxSchema,
	updateInboxSchema,
} from "@api/schemas/inbox";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	acceptInbox,
	createInbox,
	deleteInbox,
	getInbox,
	getInboxById,
	updateInbox,
} from "@mimir/db/queries/inbox";

export const inboxRouter = router({
	get: protectedProcedure
		.input(getInboxSchema)
		.query(async ({ ctx, input }) => {
			return getInbox({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	create: protectedProcedure
		.input(createInboxSchema)
		.mutation(async ({ ctx, input }) => {
			return await createInbox({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	update: protectedProcedure
		.input(updateInboxSchema)
		.mutation(async ({ ctx, input }) => {
			return updateInbox({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(getInboxByIdSchema)
		.query(async ({ ctx, input }) => {
			return getInboxById({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	delete: protectedProcedure
		.input(deleteInboxSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteInbox({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	accept: protectedProcedure
		.input(getInboxByIdSchema)
		.mutation(async ({ ctx, input }) => {
			return acceptInbox({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),
});
