import { Avatar, AvatarFallback, AvatarImage } from "@mimir/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@mimir/ui/tooltip";
import { getContrast } from "@mimir/utils/random";
import { Facehash } from "facehash";
import { UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
	name?: string | null;
	email?: string | null;
	image?: string | null;
	color?: string | null;
	className?: string;
};

const colorClasses = [
	"bg-yellow-500",
	"bg-green-500",
	"bg-blue-500",
	"bg-purple-500",
	"bg-red-500",
	"bg-pink-500",
	"bg-indigo-500",
	"bg-teal-500",
	"bg-orange-500",
	"bg-cyan-500",
];

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
					<AvatarFallback className="bg-transparent">
						<Facehash
							name={name || email || "unknown"}
							variant="gradient"
							intensity3d="medium"
							className="size-full [&_svg]:text-current!"
							colorClasses={colorClasses}
						/>
					</AvatarFallback>
					{image && (
						<AvatarImage
							src={image}
							alt={name ?? "Assignee Avatar"}
							className="size-full object-cover"
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
