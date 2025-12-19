import type { RouterOutputs } from "@api/trpc/routers";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";
import { trpc } from "@/utils/trpc";

export type PrReview = RouterOutputs["github"]["getPrReviews"]["data"][number];

interface PrReviewsContext {
	currentPr: PrReview | null;
	prReviews: PrReview[];
	setCurrentPr: (pr: PrReview) => void;
}

export const PrReviewsContext = createContext<PrReviewsContext | null>(null);

export const PrReviewsProvider = ({
	children,
	defaultPrId,
}: {
	children: React.ReactNode;
	defaultPrId?: string;
}) => {
	const [currentPrId, setCurrentPrId] = useState<string | undefined>(
		defaultPrId,
	);

	const { data } = useInfiniteQuery(
		trpc.github.getPrReviews.infiniteQueryOptions(
			{
				pageSize: 20,
				includeIds: defaultPrId ? [defaultPrId] : undefined,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor || undefined,
			},
		),
	);

	const reviews = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) ?? [];
	}, [data]);

	const currentPr = useMemo(() => {
		if (!currentPrId) return null;
		return reviews.find((pr) => pr.id === currentPrId) || null;
	}, [currentPrId, reviews]);

	return (
		<PrReviewsContext.Provider
			value={{
				currentPr,
				prReviews: reviews,
				setCurrentPr: (pr) => setCurrentPrId(pr.id),
			}}
		>
			{children}
		</PrReviewsContext.Provider>
	);
};

export const usePrReviews = () => {
	const context = useContext(PrReviewsContext);
	if (!context) {
		throw new Error("usePrReviews must be used within a PrReviewsProvider");
	}
	return context;
};
