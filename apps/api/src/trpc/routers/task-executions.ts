import { getTaskExecutionSchema } from "@api/schemas/task-executions";
import { protectedProcedure, router } from "@api/trpc/init";
import { getTaskExecutionByTaskId } from "@mimir/db/queries/task-executions";

export const taskExecutionsRouter = router({
	getByTaskId: protectedProcedure
		.input(getTaskExecutionSchema)
		.query(async ({ input }) => {
			return getTaskExecutionByTaskId(input.taskId);
		}),
});
