"use client";
import { cn } from "@ui/lib/utils";
import { format } from "date-fns";
import {
	EmptyState,
	EmptyStateDescription,
	EmptyStateTitle,
} from "../empty-state";
import { InboxFilters } from "./filters";
import { InboxSourceIcon } from "./source-icon";
import { useInbox } from "./use-inbox";
import { useInboxFilterParams } from "./use-inbox-filter-params";

export const InboxList = ({ className }: { className?: string }) => {
	const { inboxes, selectedInbox } = useInbox();
	const { setParams } = useInboxFilterParams();

	return (
		<div
			className={cn(
				"flex flex-col gap-1",
				"h-[calc(100vh-80px)] overflow-y-auto p-2",
				{
					"w-1/3": selectedInbox,
					"w-full": !selectedInbox,
				},
			)}
		>
			<InboxFilters />
			{inboxes?.length === 0 && (
				<EmptyState>
					<EmptyStateTitle>Empty</EmptyStateTitle>
					<EmptyStateDescription>You're all caught up!</EmptyStateDescription>
				</EmptyState>
			)}
			{inboxes?.map((item) => (
				<button
					key={item.id}
					type="button"
					className="w-full text-left"
					onClick={() => {
						setParams({ selectedInboxId: item.id });
					}}
				>
					<div
						className={cn(
							"cursor-pointer space-y-1 rounded-md px-4 py-2 text-sm transition-colors hover:bg-accent",
							{
								"bg-accent": selectedInbox?.id === item.id,
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
				</button>
			))}
		</div>
	);
};
