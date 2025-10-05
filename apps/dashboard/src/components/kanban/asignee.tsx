import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

type Props = {
	name?: string;
	email?: string;
	color?: string | null;
	className?: string;
};

export const AssigneeAvatar = ({ name, color, email, className }: Props) => {
	return (
		<Avatar className={cn("size-6", className)}>
			<AvatarFallback
				className="bg-primary text-primary-foreground"
				style={{
					backgroundColor: color || undefined,
				}}
			>
				{name ? name.charAt(0).toUpperCase() : null}
			</AvatarFallback>
		</Avatar>
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
