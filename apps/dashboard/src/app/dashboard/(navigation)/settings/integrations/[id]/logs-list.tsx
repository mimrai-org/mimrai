"use client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export const LogsList = ({ integrationId }: { integrationId: string }) => {
	const gricClass = "grid grid-cols-2 gap-4 px-2";

	const { data: logs } = useQuery(
		trpc.integrations.getLogs.queryOptions({ integrationId, pageSize: 20 }),
	);

	return (
		<ul>
			<li
				className={cn(
					gricClass,
					"border-b py-2 font-semibold text-muted-foreground text-xs",
				)}
			>
				<span>Message</span>
				<span className="flex justify-start">Created At</span>
			</li>
			{logs?.data.map((log) => (
				<li
					key={log.id}
					className={cn(
						gricClass,
						"rounded-xs py-1 text-sm transition-[background] hover:bg-muted",
					)}
				>
					<span>{log.message}</span>
					<span className="flex justify-start">
						{format(new Date(log.createdAt ?? ""), "PPpp")}
					</span>
				</li>
			))}
		</ul>
	);
};
