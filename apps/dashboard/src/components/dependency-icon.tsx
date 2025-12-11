import { cn } from "@ui/lib/utils";
import { MergeIcon, ShieldBanIcon, ShieldMinusIcon } from "lucide-react";

const DependencyIconComponent = {
	blocks: {
		to: ShieldMinusIcon,
		from: ShieldBanIcon,
	},
	relates_to: {
		to: MergeIcon,
		from: MergeIcon,
	},
};

export const DependencyIcon = ({
	className,
	type,
	direction,
}: {
	className?: string;
	type: "blocks" | "relates_to";
	direction?: "to" | "from";
}) => {
	const Icon = DependencyIconComponent[type][direction || "to"];
	if (!Icon) return null;

	switch (type) {
		case "blocks":
			return <Icon className={cn("text-red-500", className)} />;
		case "relates_to":
			return <Icon className={cn("text-blue-500", className)} />;
		default:
			return <Icon className={className} />;
	}
};
