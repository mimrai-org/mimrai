import { Avatar, AvatarFallback, AvatarImage } from "@mimir/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@mimir/ui/tooltip";
import { getContrast } from "@mimir/utils/random";
import { UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
	name?: string | null;
	email?: string | null;
	image?: string | null;
	color?: string | null;
	className?: string;
};

export const AssigneeAvatar = ({
	name,
	color,
	email,
	image,
	className,
}: Props) => {
	if (!name && !email) {
		return (
			<div
				className={cn(
					"flex size-6 items-center justify-center rounded-full border-1 border-dashed text-muted-foreground",
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
						className="bg-primary text-primary-foreground text-xs"
						style={{
							backgroundColor: color || undefined,
							color: color ? getContrast(color) : undefined,
						}}
					>
						{name ? name.charAt(0).toUpperCase() : null}
					</AvatarFallback>
					{image && (
						<AvatarImage
							src={image}
							alt={name ?? "Assignee Avatar"}
							className="size-full object-contain"
						/>
					)}
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
