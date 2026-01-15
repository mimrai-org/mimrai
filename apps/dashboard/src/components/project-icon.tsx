import { FolderIcon } from "lucide-react";

export const ProjectIcon = ({
	color,
	hasTasks,
	className,
}: {
	color?: string | null;
	hasTasks?: boolean;
	className?: string;
}) => {
	const Icon = hasTasks ? FolderIcon : FolderIcon;

	return <Icon className={className} style={{ color: color || "inherit" }} />;
};
