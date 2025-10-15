import { getImportsSchema } from "@api/schemas/imports";
import { protectedProcedure, router } from "@api/trpc/init";
import { getImports } from "@mimir/db/queries/imports";

export const importsRouter = router({
	get: protectedProcedure
		.input(getImportsSchema.optional())
		.query(async ({ ctx, input }) => {
			return getImports({
				...input,
				teamId: ctx.user.teamId,
			});
		}),
});
