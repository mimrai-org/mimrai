import { getContrast } from "@mimir/utils/random";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export const LabelBadge = ({
	color,
	name,
	variant = "secondary",
	className,
}: {
	color: string;
	name: string;
	variant?: "default" | "secondary" | "outline";
	className?: string;
}) => {
	return (
		<Badge
			// style={{ backgroundColor: color, color: getContrast(color) }}
			className={cn(
				"flex justify-start gap-2 rounded-sm text-start",
				className,
			)}
			variant={variant}
		>
			<div
				className="size-2 rounded-full"
				style={{ backgroundColor: color, color: getContrast(color) }}
			/>
			{name}
		</Badge>
	);
};
