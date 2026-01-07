"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import { format } from "date-fns";
import { DotIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";
import {
	EmptyState,
	EmptyStateDescription,
	EmptyStateTitle,
} from "../empty-state";
import { InboxSourceIcon } from "./source-icon";

export type Inbox = RouterOutputs["inbox"]["get"]["data"][number];

export const InboxList = ({
	className,
	inboxId,
}: {
	className?: string;
	inboxId?: string;
}) => {
	const user = useUser();
	const { data } = useInfiniteQuery(
		trpc.inbox.get.infiniteQueryOptions(
			{
				status: ["pending"],
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const flatData = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) || [];
	}, [data]);

	useEffect(() => {
		// prefetch inbox overview data
		for (const item of flatData) {
			queryClient.setQueryData(
				trpc.inbox.getById.queryKey({ id: item.id }),
				item,
			);
		}
	}, [data]);

	return (
		<div className={cn("mt-2 flex flex-col gap-1", className)}>
			{flatData?.length === 0 && (
				<EmptyState>
					<EmptyStateTitle>Empty</EmptyStateTitle>
					<EmptyStateDescription>You're all caught up!</EmptyStateDescription>
				</EmptyState>
			)}
			{flatData?.map((item) => (
				<Link
					key={item.id}
					href={`${user?.basePath}/inbox/${item.id}`}
					prefetch
				>
					<div
						className={cn(
							"cursor-pointer space-y-1 rounded-md px-4 py-2 text-sm transition-colors hover:bg-accent",
							{
								"bg-accent": inboxId === item.id,
							},
						)}
					>
						<h3
							className={cn("truncate font-medium", {
								"font-normal text-muted-foreground": item.seen,
							})}
						>
							{item.payload.title}
						</h3>
						<div className="flex justify-between">
							<p className="flex items-center gap-1 truncate text-muted-foreground text-xs capitalize">
								<InboxSourceIcon source={item.source} className="size-3.5" />{" "}
								<span className="max-w-[200px] truncate">{item.display}</span>
							</p>
							<p className="text-muted-foreground text-xs">
								{format(new Date(item.createdAt), "PP p")}
							</p>
						</div>
					</div>
				</Link>
			))}
		</div>
	);
};
