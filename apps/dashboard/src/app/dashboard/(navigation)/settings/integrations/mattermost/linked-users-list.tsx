"use client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Assignee } from "@/components/kanban/asignee-avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export const LinkedUsersList = ({
	integrationId,
}: {
	integrationId: string;
}) => {
	const gridClass = "grid grid-cols-4 gap-4 px-2";

	const { data: linkedUsers } = useQuery(
		trpc.integrations.getLinkedUsers.queryOptions({
			integrationId,
			pageSize: 20,
		}),
	);

	return (
		<ul>
			<li
				className={cn(
					gridClass,
					"border-b py-2 font-semibold text-muted-foreground text-xs",
				)}
			>
				<span>User</span>
				<span>Remote ID</span>
				<span>Display Name</span>
				<span className="flex justify-start">Created At</span>
			</li>
			{linkedUsers?.data.map((link) => (
				<li
					key={link.id}
					className={cn(
						gridClass,
						"rounded-xs py-2 text-sm transition-[background] hover:bg-muted",
					)}
				>
					<span>
						<Assignee {...link.user} />
					</span>
					<span>{link.externalUserId}</span>
					<span>{link.externalUserName}</span>
					<span className="flex justify-start">
						{format(new Date(link.createdAt ?? ""), "PPpp")}
					</span>
				</li>
			))}
		</ul>
	);
};
