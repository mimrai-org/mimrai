import {
	acceptTaskSuggestionSchema,
	getTasksSuggestionsSchema,
	rejectTaskSuggestionSchema,
} from "@api/schemas/tasks-suggestions";
import {
	acceptTaskSuggestion,
	getTasksSuggestions,
	rejectTaskSuggestion,
} from "@mimir/db/queries/tasks-suggestions";
import { protectedProcedure, router } from "../init";

export const tasksSuggestionsRouter = router({
	accept: protectedProcedure
		.input(acceptTaskSuggestionSchema)
		.mutation(async ({ input, ctx }) => {
			return acceptTaskSuggestion({
				id: input.id,
				teamId: ctx.team.id,
			});
		}),
	reject: protectedProcedure
		.input(rejectTaskSuggestionSchema)
		.mutation(async ({ input, ctx }) => {
			return rejectTaskSuggestion({
				id: input.id,
				teamId: ctx.team.id,
			});
		}),
	get: protectedProcedure
		.input(getTasksSuggestionsSchema)
		.query(async ({ input, ctx }) => {
			return getTasksSuggestions({
				...input,
				teamId: ctx.team.id,
			});
		}),
});
