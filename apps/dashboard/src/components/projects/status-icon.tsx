import { cn } from "@ui/lib/utils";
import {
	CircleCheckIcon,
	CircleDashedIcon,
	CircleDotIcon,
	CircleGaugeIcon,
} from "lucide-react";

export type ProjectStatus =
	| "planning"
	| "in_progress"
	| "completed"
	| "on_hold";

export const ProjectStatusIcon = ({
	status,
	className,
}: {
	status: ProjectStatus | null;
	className?: string;
}) => {
	switch (status) {
		case "planning":
			return <CircleDotIcon className={className} />;
		case "in_progress":
			return <CircleGaugeIcon className={cn(className, "text-yellow-400")} />;
		case "completed":
			return <CircleCheckIcon className={cn(className, "text-green-400")} />;
		case "on_hold":
			return <CircleDashedIcon className={className} />;
		default:
			return <CircleDashedIcon className={className} />;
	}
};
