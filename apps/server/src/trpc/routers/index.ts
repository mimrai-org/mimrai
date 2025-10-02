import { protectedProcedure, publicProcedure, router } from "../init";
import { chatRouter } from "./chats";
import { columnsRouter } from "./columns";
import { integrationsRouter } from "./integrations";
import { tasksRouter } from "./tasks";
import { teamsRouter } from "./teams";
import { usersRouter } from "./users";

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
	chats: chatRouter,
	users: usersRouter,
	teams: teamsRouter,
	integrations: integrationsRouter,
});
export type AppRouter = typeof appRouter;
