"use client";
import { PrReviewItem } from "./item";
import { usePrReviews } from "./use-pr-reviews";

export const PrReviewsList = () => {
	const { prReviews: reviews } = usePrReviews();

	return (
		<div className="m-2 flex-1 space-y-1 text-sm">
			{reviews.map((review) => (
				<PrReviewItem key={review.id} review={review} />
			))}
		</div>
	);
};
