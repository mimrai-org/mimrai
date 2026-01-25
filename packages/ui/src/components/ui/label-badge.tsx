import { getContrast } from "@mimir/utils/random";
import { TagIcon } from "lucide-react";
import type React from "react";
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
				"flex justify-start gap-2 rounded-sm bg-[var(--badge)]! text-start text-[var(--badge-text)]!",
				className,
			)}
			style={
				{
					"--badge": color,
					"--badge-text": getContrast(color),
				} as React.CSSProperties
			}
			variant={variant}
		>
			<TagIcon className="size-2 text-[var(--badge-text)]!" />
			{name}
		</Badge>
	);
};
