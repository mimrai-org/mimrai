import type { RouterOutputs } from "@mimir/api/trpc";
import { cn } from "@ui/lib/utils";
import {
	CircleCheckIcon,
	CircleDashedIcon,
	CircleDotIcon,
	CircleGaugeIcon,
	CircleStarIcon,
} from "lucide-react";

export const StatusIcon = ({
	type,
	className,
}: {
	type: RouterOutputs["statuses"]["get"]["data"][number]["type"];
	className?: string;
}) => {
	switch (type) {
		case "backlog":
			return <CircleDotIcon className={className} />;
		case "in_progress":
			return <CircleGaugeIcon className={cn(className, "text-yellow-400")} />;
		case "review":
			return <CircleStarIcon className={cn(className)} />;
		case "to_do":
			return <CircleDashedIcon className={className} />;
		case "done":
			return <CircleCheckIcon className={cn(className, "text-green-400")} />;
		default:
			return null;
	}
};
