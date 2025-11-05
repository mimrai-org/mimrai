import type { RouterOutputs } from "@mimir/api/trpc";
import { CircleCheckIcon, CircleDashedIcon, CircleDotIcon } from "lucide-react";

export const ColumnIcon = ({
	type,
	className,
}: {
	type: RouterOutputs["columns"]["get"]["data"][number]["type"];
	className?: string;
}) => {
	switch (type) {
		case "backlog":
			return <CircleDotIcon className={className} />;
		case "in_progress":
			return <CircleDashedIcon className={className} />;
		case "review":
			return <CircleDashedIcon className={className} />;
		case "done":
			return <CircleCheckIcon className={className} />;
		default:
			return null;
	}
};
