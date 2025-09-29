import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { columnsRouter } from "./columns";
import { tasksRouter } from "./tasks";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	tasks: tasksRouter,
	columns: columnsRouter,
});
export type AppRouter = typeof appRouter;
