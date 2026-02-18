import { FilesIcon, FileTextIcon } from "lucide-react";
import { ResourceIconRenderer } from "../resource-icon/resource-icon-renderer";

export const DocumentIcon = ({
	icon,
	className,
	hasChildren = false,
}: {
	icon: string | null | undefined;
	className?: string;
	hasChildren?: boolean;
}) => {
	return (
		<ResourceIconRenderer
			iconKey={icon}
			fallback={hasChildren ? FilesIcon : FileTextIcon}
			className={className}
		/>
	);
};
