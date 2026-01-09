import { protectedProcedure, router } from "@api/trpc/init";
import {
	generateWorkflow,
	stringifyWorkflow,
	workflowSuggestion,
} from "@api/utils/workflow";
import { createDefaultLabels, createLabel } from "@mimir/db/queries/labels";
import {
	createDefaultStatuses,
	createStatus,
} from "@mimir/db/queries/statuses";
import { updateTeam } from "@mimir/db/queries/teams";
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
				...input,
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
	defaultWorkflow: protectedProcedure.mutation(async ({ ctx }) => {
		// create statuses
		await createDefaultStatuses(ctx.user.teamId);
		// create labels
		await createDefaultLabels(ctx.user.teamId);

		return { success: true };
	}),
});
