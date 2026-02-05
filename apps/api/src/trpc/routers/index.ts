import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../init";
import { activitiesRouter } from "./activities";
import { activitiesReactionsRouter } from "./activities-reactions";
import { agentsRouter } from "./agents";
import { apiKeysRouter } from "./api-keys";
import { autopilotSettingsRouter } from "./autopilot-settings";
import { billingRouter } from "./billing";
import { chatRouter } from "./chats";
import { checklistsRouter } from "./checklists";
import { chatFeedbackRouter } from "./feedback";
import { githubRouter } from "./github";
import { globalSearchRouter } from "./global-search";
import { importsRouter } from "./imports";
import { inboxRouter } from "./inbox";
import { intakesRouter } from "./intakes";
import { integrationsRouter } from "./integrations";
import { labelsRouter } from "./labels";
import { milestonesRouter } from "./milestones";
import { newsletterRouter } from "./newsletter";
import { notificationSettingsRouter } from "./notification-settings";
import { onboardingRouter } from "./onboarding";
import { projectHealthUpdatesRouter } from "./project-health-updates";
import { projectsRouter } from "./projects";
import { shareableRouter } from "./shareable";
import { statusesRouter } from "./statuses";
import { taskDependenciesRouter } from "./task-dependencies";
import { taskExecutionsRouter } from "./task-executions";
import { taskViewsRouter } from "./task-views";
import { tasksRouter } from "./tasks";
import { tasksSuggestionsRouter } from "./tasks-suggestions";
import { teamsRouter } from "./teams";
import { usersRouter } from "./users";
import { widgetsRouter } from "./widgets";
import { zenRouter } from "./zen";

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
	taskExecutions: taskExecutionsRouter,
	apiKeys: apiKeysRouter,
	statuses: statusesRouter,
	chats: chatRouter,
	users: usersRouter,
	teams: teamsRouter,
	integrations: integrationsRouter,
	billing: billingRouter,
	labels: labelsRouter,
	activities: activitiesRouter,
	activitiesReactions: activitiesReactionsRouter,
	agents: agentsRouter,
	github: githubRouter,
	imports: importsRouter,
	inbox: inboxRouter,
	intakes: intakesRouter,
	notificationSettings: notificationSettingsRouter,
	autopilotSettings: autopilotSettingsRouter,
	widgets: widgetsRouter,
	checklists: checklistsRouter,
	projects: projectsRouter,
	projectHealthUpdates: projectHealthUpdatesRouter,
	milestones: milestonesRouter,
	newsletter: newsletterRouter,
	chatFeedback: chatFeedbackRouter,
	shareable: shareableRouter,
	tasksSuggestions: tasksSuggestionsRouter,
	taskViews: taskViewsRouter,
	globalSearch: globalSearchRouter,
	onboarding: onboardingRouter,
	zen: zenRouter,
});
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
