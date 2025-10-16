import { getContrast } from "@mimir/utils/random";
import { UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type Props = {
	name?: string;
	email?: string;
	color?: string | null;
	className?: string;
};

export const AssigneeAvatar = ({ name, color, email, className }: Props) => {
	if (!name && !email) {
		return (
			<div
				className={cn(
					"flex size-6 min-h-6 min-w-6 items-center justify-center rounded-full border-1 border-dashed text-muted-foreground",
					className,
				)}
			>
				<UserIcon className="size-3" />
			</div>
		);
	}

	return (
		<Tooltip delayDuration={500}>
			<TooltipTrigger asChild>
				<Avatar className={cn("size-6", className)}>
					<AvatarFallback
						className="bg-primary text-primary-foreground"
						style={{
							backgroundColor: color || undefined,
							color: color ? getContrast(color) : undefined,
						}}
					>
						{name ? name.charAt(0).toUpperCase() : null}
					</AvatarFallback>
				</Avatar>
			</TooltipTrigger>
			<TooltipContent>{name || email}</TooltipContent>
		</Tooltip>
	);
};

export const Assignee = (props: Props) => {
	const { name, email } = props;
	if (!name && !email) return <div />;

	return (
		<div className="flex items-center gap-2">
			<AssigneeAvatar {...props} />
			<span className="line-clamp-1 text-xs">{name || email}</span>
		</div>
	);
};
