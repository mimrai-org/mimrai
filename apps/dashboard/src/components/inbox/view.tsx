"use client";
import { cn } from "@ui/lib/utils";
import { InboxList } from "./list";
import { InboxOverview } from "./overview";
import { InboxProvider } from "./use-inbox";

export const InboxView = () => {
	return (
		<InboxProvider>
			<div className="flex h-full overflow-hidden">
				<InboxList />
				<InboxOverview />
			</div>
		</InboxProvider>
	);
};
