import { cn } from "@ui/lib/utils";
import { InboxList } from "./list";
import { InboxOverview } from "./overview";

export const InboxView = ({ inboxId }: { inboxId?: string }) => {
	return (
		<div className="flex h-full overflow-hidden">
			<InboxList
				className={cn("h-[calc(100vh-80px)] overflow-y-auto p-2", {
					"w-1/3": inboxId,
					"w-full": !inboxId,
				})}
				inboxId={inboxId}
			/>
			{inboxId && (
				<div className="flex-1 p-2">
					<InboxOverview
						inboxId={inboxId}
						className={cn("h-full rounded-lg bg-card p-4")}
					/>
				</div>
			)}
		</div>
	);
};
