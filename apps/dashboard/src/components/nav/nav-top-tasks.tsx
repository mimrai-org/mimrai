"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Skeleton } from "@ui/components/ui/skeleton";
import { ArrowRight, LayersIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/utils/trpc";
import {
	PropertyDueDate,
	PropertyPriority,
} from "../tasks-view/properties/task-properties-components";

export const NavTopTasks = () => {
	const user = useUser();
	const { data, isLoading } = useQuery(trpc.zen.queue.queryOptions());

	const top3 = useMemo(() => {
		return data?.data?.slice(0, 3);
	}, [data]);

	if (isLoading || !user) {
		return <Skeleton className="h-44 w-full rounded-md" />;
	}

	return (
		<div className="space-y-2 rounded-md border p-4">
			{top3 && top3.length > 0 ? (
				<>
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
									<PropertyPriority task={task} />
									<PropertyDueDate task={task} />
								</div>
							</div>
						</Link>
					))}
					<Link href={`${user.basePath}/views/my-tasks`}>
						<Button
							variant="ghost"
							className="p-2 font-normal text-muted-foreground"
						>
							View my tasks
							<ArrowRight />
						</Button>
					</Link>
				</>
			) : (
				<p className="text-muted-foreground text-sm">
					No tasks in your queue.
					<br />
					Take a break or create a new task.
				</p>
			)}
		</div>
	);
};
