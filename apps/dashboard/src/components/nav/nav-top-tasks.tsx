"use client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@ui/components/ui/skeleton";
import { LayersIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/utils/trpc";
import { propertiesComponents } from "../tasks-view/properties/task-properties-components";

export const NavTopTasks = () => {
	const user = useUser();
	const { data, isLoading } = useQuery(trpc.zen.queue.queryOptions());

	const top3 = useMemo(() => {
		return data?.data?.slice(0, 3);
	}, [data]);

	if (isLoading || !user) {
		return <Skeleton className="h-44 w-full rounded-md" />;
	}

	if (!top3 || top3.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2 rounded-md border p-4">
			<h2 className="font-header">Continue where you left off</h2>
			{top3?.map((task) => (
				<Link
					key={task.id}
					href={`${user?.basePath}/projects/${task.projectId}/${task.id}`}
				>
					<div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent dark:hover:bg-accent/30">
						<LayersIcon className="size-4 text-muted-foreground" />
						<span className="text-muted-foreground">
							{user?.team?.prefix}-{task.sequence}
						</span>
						{task.title}

						<div className="ml-auto flex items-center gap-1">
							{propertiesComponents.priority(task)}
							{propertiesComponents.dueDate(task)}
						</div>
					</div>
				</Link>
			))}
		</div>
	);
};
