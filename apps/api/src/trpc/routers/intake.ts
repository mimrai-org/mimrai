import { protectedProcedure, router } from "@api/trpc/init";
import { db } from "@mimir/db/client";
import {
	getIntakeItemById,
	getIntakes,
	updateIntakeItemStatus,
} from "@mimir/db/queries/intake";
import { createTask } from "@mimir/db/queries/tasks";
import { intake, intakeStatusEnum } from "@mimir/db/schema";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const intakeRouter = router({
	getIntakes: protectedProcedure
		.input(
			z.object({
				pageSize: z.number().min(1).max(100).optional(),
				cursor: z.string().optional(),
				status: z.enum(intakeStatusEnum.enumValues).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await getIntakes({
				teamId: ctx.user.teamId!,
				status: input.status,
				pageSize: input.pageSize,
				cursor: input.cursor,
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
