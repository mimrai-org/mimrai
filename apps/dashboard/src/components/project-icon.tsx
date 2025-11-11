import { BoxIcon } from "lucide-react";

export const ProjectIcon = ({
	color,
	className,
}: {
	color?: string | null;
	className?: string;
}) => {
	return (
		<BoxIcon className={className} style={{ color: color || "inherit" }} />
	);
};
