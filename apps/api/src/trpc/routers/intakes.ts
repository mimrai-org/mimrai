import {
	createIntakeSchema,
	deleteIntakeSchema,
	getIntakeByIdSchema,
	getIntakesSchema,
	updateIntakeSchema,
} from "@api/schemas/intakes";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	acceptIntake,
	createIntake,
	deleteIntake,
	getIntakeById,
	getIntakes,
	updateIntake,
} from "@mimir/db/queries/intakes";

export const intakesRouter = router({
	get: protectedProcedure
		.input(getIntakesSchema)
		.query(async ({ ctx, input }) => {
			return getIntakes({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	create: protectedProcedure
		.input(createIntakeSchema)
		.mutation(async ({ ctx, input }) => {
			return await createIntake({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	update: protectedProcedure
		.input(updateIntakeSchema)
		.mutation(async ({ ctx, input }) => {
			return updateIntake({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(getIntakeByIdSchema)
		.query(async ({ ctx, input }) => {
			return getIntakeById({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	delete: protectedProcedure
		.input(deleteIntakeSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteIntake({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	accept: protectedProcedure
		.input(getIntakeByIdSchema)
		.mutation(async ({ ctx, input }) => {
			return acceptIntake({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),
});
