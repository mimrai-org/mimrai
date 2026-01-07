import { CircleDashedIcon } from "lucide-react";
import type { FilterOptions } from "../filters/types";

export const inboxFilterOptions: FilterOptions = {
	status: {
		label: "Status",
		multiple: true,
		icon: <CircleDashedIcon className="size-4!" />,
		filterKey: "status",
		queryOptions: {
			queryKey: ["inbox.getStatuses"],
			queryFn: () =>
				Promise.resolve([
					{ label: "Pending", value: "pending" },
					{ label: "Archived", value: "archived" },
					{ label: "Accepted", value: "accepted" },
					{ label: "Dismissed", value: "dismissed" },
				]),
		},
	},
};
