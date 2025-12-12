import { protectedProcedure, router } from "@api/trpc/init";
import {
	generateWorkflow,
	stringifyWorkflow,
	workflowSuggestion,
} from "@api/utils/workflow";
import { createStatus } from "@db/queries/columns";
import { createLabel } from "@db/queries/labels";
import { updateTeam } from "@db/queries/teams";
import z from "zod";

export const onboardingRouter = router({
	generateWorkflow: protectedProcedure
		.input(
			z.object({
				whatYourTeamDoes: z.string().min(1),
				currentTool: z.string().optional(),
				howIsYourWorkflow: z.string().min(1).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return generateWorkflow({
				whatYourTeamDoes: input.whatYourTeamDoes,
				howIsYourWorkflow: input.howIsYourWorkflow,
			});
		}),
	confirmWorkflow: protectedProcedure
		.input(
			z.object({
				workflowSuggestion: workflowSuggestion,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Create statuses
			await Promise.all(
				input.workflowSuggestion.statuses.map((status) =>
					createStatus({
						name: status.name,
						description: status.description,
						type: status.type,
						order: status.order,
						teamId: ctx.user.teamId,
					}),
				),
			);

			await Promise.all(
				input.workflowSuggestion.labels.map((label) =>
					createLabel({
						name: label.name,
						description: label.description,
						color: label.color,
						teamId: ctx.user.teamId,
					}),
				),
			);

			await updateTeam({
				id: ctx.user.teamId,
				description: stringifyWorkflow(input.workflowSuggestion),
			});

			return { success: true };
		}),
});
