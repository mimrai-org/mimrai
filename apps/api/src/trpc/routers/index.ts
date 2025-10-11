import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../init";
import { activitiesRouter } from "./activities";
import { billingRouter } from "./billing";
import { chatRouter } from "./chats";
import { columnsRouter } from "./columns";
import { githubRouter } from "./github";
import { integrationsRouter } from "./integrations";
import { labelsRouter } from "./labels";
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
	billing: billingRouter,
	labels: labelsRouter,
	activities: activitiesRouter,
	github: githubRouter,
});
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
