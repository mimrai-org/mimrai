import type { InferInsertModel } from "drizzle-orm";
import { db } from "../index";
import { prReviews } from "../schema";

export const syncPrReview = async ({
	...input
}: InferInsertModel<typeof prReviews>) => {
	return db
		.insert(prReviews)
		.values({
			...input,
		})
		.onConflictDoUpdate({
			target: prReviews.externalId,
			set: {
				...input,
			},
		})
		.returning();
};
