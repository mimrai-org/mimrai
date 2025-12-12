import { globalSearch } from "@db/queries/global-search";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../init";
import { activitiesRouter } from "./activities";
import { autopilotSettingsRouter } from "./autopilot-settings";
import { billingRouter } from "./billing";
import { chatRouter } from "./chats";
import { checklistsRouter } from "./checklists";
import { statusesRouter } from "./columns";
import { chatFeedbackRouter } from "./feedback";
import { githubRouter } from "./github";
import { globalSearchRouter } from "./global-search";
import { importsRouter } from "./imports";
import { integrationsRouter } from "./integrations";
import { labelsRouter } from "./labels";
import { milestonesRouter } from "./milestones";
import { newsletterRouter } from "./newsletter";
import { notificationSettingsRouter } from "./notification-settings";
import { onboardingRouter } from "./onboarding";
import { projectsRouter } from "./projects";
import { shareableRouter } from "./shareable";
import { taskDependenciesRouter } from "./task-dependencies";
import { tasksRouter } from "./tasks";
import { tasksSuggestionsRouter } from "./tasks-suggestions";
import { teamsRouter } from "./teams";
import { usersRouter } from "./users";
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
	taskDependencies: taskDependenciesRouter,
	statuses: statusesRouter,
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
	autopilotSettings: autopilotSettingsRouter,
	widgets: widgetsRouter,
	checklists: checklistsRouter,
	projects: projectsRouter,
	milestones: milestonesRouter,
	newsletter: newsletterRouter,
	chatFeedback: chatFeedbackRouter,
	shareable: shareableRouter,
	tasksSuggestions: tasksSuggestionsRouter,
	globalSearch: globalSearchRouter,
	onboarding: onboardingRouter,
});
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
