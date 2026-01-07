"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo } from "react";
import { queryClient, trpc } from "@/utils/trpc";
import { useInboxFilterParams } from "./use-inbox-filter-params";

export type Inbox = RouterOutputs["inbox"]["get"]["data"][number];

export interface InboxContextValue {
	inboxId?: string;
	inboxes: Inbox[];
	selectedInbox?: Inbox;
}

export const InboxContext = createContext<InboxContextValue | undefined>(
	undefined,
);

export const InboxProvider = ({ children }: { children: React.ReactNode }) => {
	const { params } = useInboxFilterParams();

	const { data } = useInfiniteQuery(
		trpc.inbox.get.infiniteQueryOptions(
			{
				status: params.status ?? ["pending"],
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const flatData = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) || [];
	}, [data]);

	const selectedInbox = useMemo(() => {
		return flatData.find((inbox) => inbox.id === params.selectedInboxId);
	}, [flatData, params.selectedInboxId]);

	useEffect(() => {
		// prefetch inbox overview data
		for (const item of flatData) {
			queryClient.setQueryData(
				trpc.inbox.getById.queryKey({ id: item.id }),
				item,
			);
		}
	}, [flatData]);

	return (
		<InboxContext.Provider
			value={{
				inboxId: params.selectedInboxId ?? undefined,
				inboxes: flatData,
				selectedInbox,
			}}
		>
			{children}
		</InboxContext.Provider>
	);
};

export const useInbox = () => {
	const context = useContext(InboxContext);
	if (!context) {
		throw new Error("useInbox must be used within an InboxProvider");
	}
	return context;
};
