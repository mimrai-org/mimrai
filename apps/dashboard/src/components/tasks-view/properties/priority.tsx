import { Tooltip, TooltipContent, TooltipTrigger } from "@mimir/ui/tooltip";
import {
	SignalHighIcon,
	SignalLowIcon,
	SignalMediumIcon,
	TriangleAlertIcon,
} from "lucide-react";

const PriorityTooltip = ({
	value,
	children,
}: {
	value: "low" | "medium" | "high" | "urgent";
	children: React.ReactNode;
}) => {
	return (
		<Tooltip delayDuration={500}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent className="capitalize">{value}</TooltipContent>
		</Tooltip>
	);
};

export const PriorityIcon = {
	low: <SignalLowIcon className="mb-1 size-4 text-muted-foreground" />,
	medium: <SignalMediumIcon className="mb-1 size-4" />,
	high: <SignalHighIcon className="mb-1 size-4 text-yellow-400" />,
	urgent: <TriangleAlertIcon className="size-4 text-red-400" />,
};

export const Priority = ({
	value,
}: {
	value: "low" | "medium" | "high" | "urgent";
}) => {
	const Icon = PriorityIcon[value];
	return (
		<PriorityTooltip value={value}>
			<div>{Icon}</div>
		</PriorityTooltip>
	);
};

export const PriorityItem = ({
	value,
}: {
	value: "low" | "medium" | "high" | "urgent";
}) => {
	return (
		<div className="flex gap-1">
			{PriorityIcon[value]}
			<span className="capitalize">{value}</span>
		</div>
	);
};
