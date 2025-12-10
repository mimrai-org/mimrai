import { db } from "@db/index";
import { newsletter } from "@db/schema";
import z from "zod";
import { publicProcedure, router } from "../init";

export const newsletterRouter = router({
	join: publicProcedure
		.input(
			z.object({
				email: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { email } = input;

			try {
				await db.insert(newsletter).values({
					email,
				});
			} catch (e) {
				console.error("Error adding to newsletter:", e);
				return { success: true };
			}

			return { success: true };
		}),
});
