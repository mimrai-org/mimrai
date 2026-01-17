"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useTaskViewParams } from "@/hooks/use-task-view-params";
import { trpc } from "@/utils/trpc";
import { TaskViewForm } from "../forms/task-view/form";

export const TaskViewUpdateSheet = () => {
	const { viewId, setParams } = useTaskViewParams();

	const isOpen = Boolean(viewId);

	const { data: taskView } = useQuery(
		trpc.taskViews.getById.queryOptions(
			{ id: viewId! },
			{
				enabled: isOpen,
				placeholderData: (data) => data,
			},
		),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Task View</DialogTitle>
				</DialogHeader>
				{taskView && (
					<TaskViewForm
						defaultValues={{
							...taskView,
							description: taskView.description || "",
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
