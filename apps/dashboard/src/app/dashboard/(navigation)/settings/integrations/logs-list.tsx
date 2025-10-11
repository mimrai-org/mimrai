"use client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export const LogsList = ({ integrationId }: { integrationId: string }) => {
	const gricClass = "grid grid-cols-3 gap-4 px-2";

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
				<span className="flex justify-end">Used Tokens</span>
				<span className="flex justify-end">Created At</span>
			</li>
			{logs?.data.map((log) => (
				<li
					key={log.id}
					className={cn(
						gricClass,
						"rounded-xs border-b py-2 text-sm transition-[background] last:border-0 hover:bg-muted",
					)}
				>
					<span>{log.message}</span>
					<span className="flex justify-end">
						{log.inputTokens} / {log.outputTokens}
					</span>
					<span className="flex justify-end">
						{format(new Date(log.createdAt ?? ""), "PPpp")}
					</span>
				</li>
			))}
		</ul>
	);
};
