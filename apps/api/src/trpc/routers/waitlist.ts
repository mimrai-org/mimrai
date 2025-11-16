import { db } from "@db/index";
import { waitlist } from "@db/schema";
import z from "zod";
import { publicProcedure, router } from "../init";

export const waitlistRouter = router({
	join: publicProcedure
		.input(
			z.object({
				email: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { email } = input;

			try {
				await db.insert(waitlist).values({
					email,
				});
			} catch (e) {
				return { success: true };
			}

			return { success: true };
		}),
});
