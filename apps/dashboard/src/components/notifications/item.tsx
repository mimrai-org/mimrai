import { useMutation } from "@tanstack/react-query";
import { Checkbox } from "@ui/components/ui/checkbox";
import { cn } from "@ui/lib/utils";
import Link from "next/link";
import type { HTMLAttributes } from "react";
import { trpc } from "@/utils/trpc";
import { useNotificationStore } from "./store";

export interface NotificationItemProps {
	id: string;
	title: string;
	description: string;
	createdAt: Date;
	href?: string;
	status: "read" | "unread" | "archived";
	icon?: React.ComponentType<HTMLAttributes<SVGElement>>;
}

export const NotificationItem = ({
	id,
	title,
	description,
	createdAt,
	href,
	status = "unread",
	icon: Icon,
}: NotificationItemProps) => {
	const { selectedIds, toggleSelection, clearSelection } =
		useNotificationStore();

	const { mutate: bulkUpdate } = useMutation(
		trpc.activities.bulkUpdate.mutationOptions({}),
	);

	return (
		<div className="flex items-center justify-between px-2 py-4 hover:bg-accent/50">
			<div className="flex items-center gap-2">
				<Checkbox
					checked={selectedIds.get(id)}
					onCheckedChange={(checked) => {
						toggleSelection(id, checked as boolean);
					}}
				/>
				<Link
					href={href ?? "#"}
					className="flex items-center gap-2"
					onClick={() => {
						bulkUpdate({
							ids: [id],
							status: "read",
						});
					}}
				>
					<div
						className={cn(
							"flex size-9 items-center justify-center rounded-full",
							{
								"bg-muted": status === "read",
								"bg-primary text-primary-foreground": status === "unread",
								"bg-secondary/50 text-secondary-foreground":
									status === "archived",
							},
						)}
					>
						{Icon && <Icon className="size-4" />}
					</div>
					<div>
						<h2 className="text-sm">{title}</h2>
						<p className="text-muted-foreground text-xs">{description}</p>
					</div>
				</Link>
			</div>
			<div>
				<time className="text-xs">{createdAt.toLocaleDateString()}</time>
			</div>
		</div>
	);
};
