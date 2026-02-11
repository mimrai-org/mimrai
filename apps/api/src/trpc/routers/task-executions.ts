import { getTaskExecutionSchema } from "@api/schemas/task-executions";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	getTaskExecutionByTaskId,
	getTaskExecutionLogs,
} from "@mimir/db/queries/task-executions";

export const taskExecutionsRouter = router({
	getByTaskId: protectedProcedure
		.input(getTaskExecutionSchema)
		.query(async ({ input }) => {
			return getTaskExecutionByTaskId(input.taskId);
		}),

	getLogsByTaskId: protectedProcedure
		.input(getTaskExecutionSchema)
		.query(async ({ input, ctx }) => {
			return getTaskExecutionLogs({
				taskId: input.taskId,
				teamId: ctx.team.id,
			});
		}),
});
