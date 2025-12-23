"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@ui/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import { getNotificationItemProps } from "../notifications/list";

export const ActivityWidget = ({ className }: { className?: string }) => {
	const { setParams } = useTaskParams();
	const user = useUser();
	const { data } = useQuery(
		trpc.activities.get.queryOptions({
			pageSize: 10,
		}),
	);

	return (
		<Card className={className}>
			<CardHeader>
				<CardDescription>Recent activities</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{data?.data.map((activity) => {
						const props = getNotificationItemProps({
							activity,
							user,
						});

						if (!props) return null;

						const Icon = props.icon;

						return (
							<li
								key={activity.id}
								className="grid grid-cols-[0_1fr] items-center gap-2 border-b pb-2 last:border-0 has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]"
							>
								{Icon && <Icon className="size-4 text-muted-foreground" />}
								<div className="truncate text-xs">
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="truncate">{props.title}</div>
										</TooltipTrigger>
										<TooltipContent className="max-w-sm">
											{props.title}
										</TooltipContent>
									</Tooltip>
									<div className="truncate text-muted-foreground text-xs">
										{props.description}
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
};
