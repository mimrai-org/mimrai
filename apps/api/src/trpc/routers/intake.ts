import { protectedProcedure, router } from "@api/trpc/init";
import { db } from "@mimir/db/client";
import {
	getIntakeItemById,
	getIntakeItems,
	updateIntakeItemStatus,
} from "@mimir/db/queries/intake";
import { createTask } from "@mimir/db/queries/tasks";
import { intake, intakeStatusEnum } from "@mimir/db/schema";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const intakeRouter = router({
	getPending: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).optional(),
				offset: z.number().min(0).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await getIntakeItems({
				teamId: ctx.user.teamId!,
				status: "pending",
				limit: input.limit,
				offset: input.offset,
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const item = await getIntakeItemById({
				id: input.id,
				teamId: ctx.user.teamId!,
			});

			if (!item) {
				throw new Error("Item not found");
			}
			return item;
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(intakeStatusEnum.enumValues),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await updateIntakeItemStatus({
				id: input.id,
				teamId: ctx.user.teamId!,
				status: input.status,
			});
		}),

	acceptAndCreateTask: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string(),
				description: z.string().optional(),
				columnId: z.string(),
				assigneeId: z.string().optional(),
				priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...taskData } = input;

			// Fetch the intake item
			const item = await getIntakeItemById({
				id,
				teamId: ctx.user.teamId!,
			});

			if (!item) {
				throw new Error("Intake item not found");
			}

			// Create the task
			const task = await createTask({
				...taskData,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});

			// Update intake item
			await db
				.update(intake)
				.set({
					status: "accepted",
					taskId: task.id,
					updatedAt: new Date().toISOString(),
				})
				.where(and(eq(intake.id, id), eq(intake.teamId, ctx.user.teamId!)));

			return { task, intake: item };
		}),
});
