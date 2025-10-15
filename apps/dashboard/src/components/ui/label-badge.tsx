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
			style={{ backgroundColor: color, color: getContrast(color) }}
			className="rounded-xs"
			variant="secondary"
		>
			{name}
		</Badge>
	);
};
