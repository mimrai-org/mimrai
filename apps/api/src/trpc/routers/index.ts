import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { check } from "zod";
import { protectedProcedure, publicProcedure, router } from "../init";
import { activitiesRouter } from "./activities";
import { billingRouter } from "./billing";
import { chatRouter } from "./chats";
import { checklistsRouter } from "./checklists";
import { columnsRouter } from "./columns";
import { chatFeedbackRouter } from "./feedback";
import { githubRouter } from "./github";
import { importsRouter } from "./imports";
import { integrationsRouter } from "./integrations";
import { labelsRouter } from "./labels";
import { notificationSettingsRouter } from "./notification-settings";
import { projectsRouter } from "./projects";
import { resumeSettingsRouter } from "./resume-settings";
import { tasksRouter } from "./tasks";
import { teamsRouter } from "./teams";
import { usersRouter } from "./users";
import { waitlistRouter } from "./waitlist";
import { widgetsRouter } from "./widgets";

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
	imports: importsRouter,
	notificationSettings: notificationSettingsRouter,
	resumeSettings: resumeSettingsRouter,
	widgets: widgetsRouter,
	checklists: checklistsRouter,
	projects: projectsRouter,
	waitlist: waitlistRouter,
	chatFeedback: chatFeedbackRouter,
});
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
