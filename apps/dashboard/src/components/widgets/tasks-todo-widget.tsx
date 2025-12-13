"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@ui/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/ui/table";
import { format } from "date-fns";
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
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-end">Due Date</TableHead>
							<TableHead className="text-end">Assigned</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.map((task) => (
							<TableRow
								key={task.id}
								onClick={() => {
									setParams({ taskId: task.id });
								}}
							>
								<TableCell className="max-w-48">
									<div className="flex w-full items-center gap-2">
										<Priority value={task.priority} />
										<div className="truncate">{task.title}</div>
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center justify-start gap-2">
										<StatusIcon {...task.status} className="size-3.5" />
										{task.status.name}
									</div>
								</TableCell>
								<TableCell className="text-end">
									{task.dueDate ? (
										<span>{format(new Date(task.dueDate), "PPP")}</span>
									) : (
										<span className="text-center text-muted-foreground">-</span>
									)}
								</TableCell>
								<TableCell>
									<div className="flex w-full justify-end">
										<AssigneeAvatar {...task.assignee} />
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
};
