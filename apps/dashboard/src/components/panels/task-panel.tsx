"use client";
import { Skeleton } from "@mimir/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { TaskForm } from "@/components/forms/task-form/form";
import { useTaskRealtime } from "@/hooks/use-task-realtime";
import { trpc } from "@/utils/trpc";
import { useUser } from "../user-provider";
import { PanelContainer } from "./panel-container";
import { type PanelInstance, usePanel } from "./panel-context";

export const TASK_PANEL_TYPE = "task";

interface TaskPanelProps {
	panel: PanelInstance;
	index: number;
}

function TaskPanelContent({ panel }: { panel: PanelInstance }) {
	const { data: task } = useQuery(
		trpc.tasks.getById.queryOptions(
			{ id: panel.id },
			{
				placeholderData: (old) => {
					if (panel.id === old?.id) return old;
					return undefined;
				},
			},
		),
	);

	useTaskRealtime(task?.id);

	if (!task) {
		return (
			<div className="p-6">
				<Skeleton className="h-[200px] w-full" />
			</div>
		);
	}

	return (
		<TaskForm
			defaultValues={{
				...task,
				labels: task.labels?.map((label) => label.id) || [],
			}}
		/>
	);
}

export function TaskPanel({ panel, index }: TaskPanelProps) {
	const user = useUser();
	return (
		<PanelContainer
			panel={panel}
			index={index}
			maximizeLink={`${user.basePath}/tasks/${panel.id}`}
		>
			<TaskPanelContent panel={panel} />
		</PanelContainer>
	);
}

export function useTaskPanel() {
	return usePanel(TASK_PANEL_TYPE);
}
