import { getContrast } from "@mimir/utils/random";
import { Badge } from "./badge";

export const LabelBadge = ({
	color,
	name,
}: {
	color: string;
	name: string;
}) => {
	return (
		<Badge
			// style={{ backgroundColor: color, color: getContrast(color) }}
			className="flex justify-start rounded-xs text-start"
			variant="secondary"
		>
			<div
				className="size-3 rounded-full"
				style={{ backgroundColor: color, color: getContrast(color) }}
			/>
			{name}
		</Badge>
	);
};
