import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Card, CardContent } from "@ui/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@ui/components/ui/dialog";
import { Skeleton } from "@ui/components/ui/skeleton";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import Loader from "./loader";
import { useUser } from "./user-provider";

export const TaskExecutionCard = ({ taskId }: { taskId: string }) => {
	const user = useUser();
	const { data: taskExecution } = useQuery(
		trpc.taskExecutions.getByTaskId.queryOptions(
			{
				taskId,
			},
			{
				refetchInterval: ({ state }) => {
					if (
						!state.data?.status ||
						state.data?.status === "completed" ||
						state.data?.status === "failed" ||
						state.data?.status === "blocked"
					) {
						return false;
					}

					return 5000;
				},
			},
		),
	);

	if (!taskExecution) {
		return null;
	}

	const memory = taskExecution?.memory as { summary: string } | undefined;

	return (
		<Card className="group p-0">
			<CardContent className="space-y-2 p-2">
				<div className="flex items-center justify-between">
					{taskExecution.status === "executing" && (
						<div className="flex items-center gap-2 text-sm">
							<Loader className="size-4" />
							<span>Executing...</span>
						</div>
					)}
					{taskExecution.status === "completed" && (
						<div className="flex items-center gap-2 text-sm">
							<CheckIcon className="size-4" />
							<span>Completed</span>
						</div>
					)}
					{taskExecution.status === "failed" && (
						<div className="flex items-center gap-2 text-red-500 text-sm">
							<span>Failed</span>
						</div>
					)}

					<Link href={`${user.basePath}/chat/${taskExecution.taskId}`}>
						<Button
							size="sm"
							variant="ghost"
							className="h-5.5 text-xs opacity-0 group-hover:opacity-100"
							type="button"
						>
							View chat
						</Button>
					</Link>
				</div>
				<div className="flex flex-wrap items-center gap-2 text-xs">
					<span className="text-muted-foreground">Input</span>
					<span>
						{taskExecution.usageMetrics?.inputTokens ?? (
							<Skeleton className="h-3 w-6" />
						)}
					</span>
					<span className="text-muted-foreground">Output</span>
					<span>
						{taskExecution.usageMetrics?.outputTokens ?? (
							<Skeleton className="h-3 w-6" />
						)}
					</span>
					<span className="text-muted-foreground">Cost</span>
					<span>
						{taskExecution.usageMetrics?.costUSD ?? (
							<Skeleton className="h-3 w-6" />
						)}
					</span>
				</div>
				{memory.summary && (
					<p className="text-muted-foreground text-xs">{memory?.summary}</p>
				)}
			</CardContent>
		</Card>
	);
};
