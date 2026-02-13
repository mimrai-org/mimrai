"use client";
import { Skeleton } from "@mimir/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { TaskForm } from "@/components/forms/task-form/form";
import { trpc } from "@/utils/trpc";
import { useUser } from "../user-provider";
import { PanelContainer } from "./panel-container";
import { type PanelInstance, usePanel } from "./panel-context";

export const TASK_PANEL_TYPE = "task";
export const CREATE_TASK_PANEL_TYPE = "create-task";
export const CLONE_TASK_PANEL_TYPE = "clone-task";

interface TaskPanelProps {
	panel: PanelInstance;
	index: number;
}

function TaskPanelContent({ panel }: { panel: PanelInstance }) {
	const { data: task } = useQuery(
		trpc.tasks.getById.queryOptions({ id: panel.id }),
	);

	if (!task) {
		return (
			<div className="p-6">
				<Skeleton className="h-[16px] w-[50px] rounded-sm" />
				<Skeleton className="mt-2 h-[32px] w-full" />
				<Skeleton className="mt-2 h-[100px] w-full" />
			</div>
		);
	}

	console.log("Rendering TaskPanelContent for task:", task);

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

export function CreateTaskPanel({ panel, index }: TaskPanelProps) {
	return (
		<PanelContainer panel={panel} index={index}>
			<TaskForm
				defaultValues={{
					...panel.data,
				}}
			/>
		</PanelContainer>
	);
}

export function CloneTaskPanelContent({ panel }: { panel: PanelInstance }) {
	const { data: originalTask } = useQuery(
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

	if (!originalTask) {
		return (
			<div className="p-6">
				<Skeleton className="h-[16px] w-[50px] rounded-sm" />
				<Skeleton className="mt-2 h-[32px] w-full" />
				<Skeleton className="mt-2 h-[100px] w-full" />
			</div>
		);
	}

	return (
		<TaskForm
			defaultValues={{
				...originalTask,
				labels: originalTask.labels?.map((label) => label.id) || [],
				id: undefined, // Clear the ID for cloning
				title: `${originalTask.title} (Copy)`, // Optionally modify the title for clarity
				// Clear or modify other fields as needed for cloning
				dueDate: undefined,
				recurring: undefined,
			}}
		/>
	);
}

export function CloneTaskPanel({ panel, index }: TaskPanelProps) {
	return (
		<PanelContainer panel={panel} index={index}>
			<CloneTaskPanelContent panel={panel} />
		</PanelContainer>
	);
}

export function useTaskPanel() {
	return usePanel(TASK_PANEL_TYPE);
}

export function useCreateTaskPanel() {
	return usePanel(CREATE_TASK_PANEL_TYPE);
}

export function useCloneTaskPanel() {
	return usePanel(CLONE_TASK_PANEL_TYPE);
}
