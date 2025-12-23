"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@ui/components/ui/card";
import { useTaskParams } from "@/hooks/use-task-params";
import { trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import { StatusIcon } from "../status-icon";
import { Priority } from "../tasks-view/properties/priority";

export const TasksTodoWidget = ({ className }: { className?: string }) => {
	const { setParams } = useTaskParams();
	const { data } = useQuery(trpc.widgets.tasksTodo.queryOptions());

	return (
		<Card className={className}>
			<CardHeader>
				<CardDescription>
					Important tasks that are yet to be completed
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{data?.map((task) => (
						<li
							key={task.id}
							onClick={() => {
								setParams({ taskId: task.id });
							}}
							className="grid cursor-pointer grid-cols-[calc(var(--spacing)*4)_calc(var(--spacing)*4)_1fr_calc(var(--spacing)*4)] items-center gap-2 border-b pb-2 last:border-0"
						>
							<Priority value={task.priority} />
							<StatusIcon {...task.status} className="size-3.5" />
							<div className="truncate text-sm">{task.title}</div>
							<div className="ml-auto">
								<AssigneeAvatar {...task.assignee} className="size-4" />
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
