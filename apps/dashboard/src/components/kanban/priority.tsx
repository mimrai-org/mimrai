import { Badge } from "../ui/badge";

export const Priority = ({ value }: { value: "low" | "medium" | "high" }) => {
	if (value === "low") {
		return (
			<div className="flex items-center gap-1">
				<div className="size-1 bg-secondary" />
			</div>
		);
	}

	if (value === "medium") {
		return (
			<div className="flex items-center gap-1">
				<div className="size-1 bg-primary" />
				<div className="size-1 bg-primary" />
			</div>
		);
	}

	if (value === "high") {
		return (
			<div className="flex items-center gap-1">
				<div className="size-1 bg-red-500" />
				<div className="size-1 bg-red-500" />
				<div className="size-1 bg-red-500" />
			</div>
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
