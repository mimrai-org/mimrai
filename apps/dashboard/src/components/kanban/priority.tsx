import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const PriorityTooltip = ({
	value,
	children,
}: {
	value: "low" | "medium" | "high";
	children: React.ReactNode;
}) => {
	return (
		<Tooltip delayDuration={500}>
			<TooltipTrigger>{children}</TooltipTrigger>
			<TooltipContent className="capitalize">{value}</TooltipContent>
		</Tooltip>
	);
};

export const Priority = ({ value }: { value: "low" | "medium" | "high" }) => {
	if (value === "low") {
		return (
			<PriorityTooltip value={value}>
				<div className="flex items-center gap-1">
					<div className="size-1 bg-secondary" />
				</div>
			</PriorityTooltip>
		);
	}

	if (value === "medium") {
		return (
			<PriorityTooltip value={value}>
				<div className="flex items-center gap-1">
					<div className="size-1 bg-primary" />
					<div className="size-1 bg-primary" />
				</div>
			</PriorityTooltip>
		);
	}

	if (value === "high") {
		return (
			<PriorityTooltip value={value}>
				<div className="flex items-center gap-1">
					<div className="size-1 bg-red-500" />
					<div className="size-1 bg-red-500" />
					<div className="size-1 bg-red-500" />
				</div>
			</PriorityTooltip>
		);
	}

	return null;
};

export const PriorityBadge = ({
	value,
}: {
	value: "low" | "medium" | "high";
}) => {
	if (value === "low") {
		return <Badge variant="secondary">Low</Badge>;
	}

	if (value === "medium") {
		return <Badge variant="default">Medium</Badge>;
	}

	if (value === "high") {
		return <Badge variant="destructive">High</Badge>;
	}

	return null;
};
