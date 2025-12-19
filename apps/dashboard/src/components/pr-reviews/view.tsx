import { PrReviewsList } from "./list";
import { PrReviewsOverview } from "./overview";
import { PrReviewsProvider } from "./use-pr-reviews";

export const PrReviewsView = ({ defaultPrId }: { defaultPrId?: string }) => {
	return (
		<PrReviewsProvider defaultPrId={defaultPrId}>
			<div className="flex h-full">
				<PrReviewsList />
				<PrReviewsOverview />
			</div>
		</PrReviewsProvider>
	);
};
