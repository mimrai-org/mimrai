import { protectedProcedure, router } from "@api/trpc/init";
import { globalSearch } from "@mimir/db/queries/global-search";
import z from "zod";

export const globalSearchRouter = router({
	search: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				type: z.array(z.string()).optional(),
			}),
		)
		.query(async ({ input, ctx }) => {
			return globalSearch({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
