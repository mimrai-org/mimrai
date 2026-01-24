"use client";
import type { RouterOutputs } from "@mimir/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import {
	FolderKanbanIcon,
	FolderPlusIcon,
	FolderSearchIcon,
	FolderSymlinkIcon,
	KanbanIcon,
	SaveAllIcon,
	ViewIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { TaskViewForm } from "@/components/forms/task-view/form";
import { useUser } from "@/components/user-provider";
import { TaskViewContextMenu } from "@/components/views/context-menu";
import {
	DEFAULT_VIEWS,
	type DefaultTaskView,
} from "@/components/views/default-views";
import { useTaskViewParams } from "@/hooks/use-task-view-params";
import { queryClient, trpc } from "@/utils/trpc";
import { useTasksViewContext } from "../tasks-view";

type View = RouterOutputs["taskViews"]["get"]["data"][number];

export const TasksViewsList = ({ projectId }: { projectId: string }) => {
	const user = useUser();
	const [open, setOpen] = useState(false);
	const { setParams } = useTaskViewParams();
	const { viewId, filters } = useTasksViewContext();
	const { data: taskViews } = useQuery(
		trpc.taskViews.get.queryOptions({
			projectId,
			pageSize: 20,
		}),
	);

	return (
		<div>
			<div className="mb-1 flex flex-wrap gap-1">
				{DEFAULT_VIEWS.map((view) => (
					<TasksViewItem
						key={view.id}
						view={view}
						selectedViewId={viewId}
						projectId={projectId}
					/>
				))}
				<div className="w-px bg-border" />
				{taskViews?.data.map((view) => (
					<TasksViewItem
						key={view.id}
						view={view}
						selectedViewId={viewId}
						projectId={projectId}
					/>
				))}
				<button
					type="button"
					onClick={() => {
						setOpen((prev) => !prev);
					}}
					className="flex w-fit items-center rounded-sm px-2 py-1 text-xs hover:bg-accent dark:hover:bg-accent/30"
				>
					<FolderPlusIcon className="size-3.5 text-muted-foreground" />
				</button>
			</div>
			{open && (
				<div className="my-2 animate-blur-in rounded-sm border p-4">
					<TaskViewForm
						defaultValues={{
							viewType: filters.viewType,
							projectId: projectId,
						}}
						filters={filters}
						onSubmit={() => setOpen(false)}
					/>
				</div>
			)}
		</div>
	);
};

const TasksViewItem = ({
	view,
	selectedViewId,
	projectId,
}: {
	view: DefaultTaskView | View;
	selectedViewId: string;
	projectId: string;
}) => {
	const user = useUser();

	const viewLink = projectId
		? `${user.basePath}/projects/${projectId}/views/${view.id}`
		: `${user.basePath}/views/${view.id}`;

	const project = "project" in view ? view.project : null;

	return (
		<TaskViewContextMenu view={view}>
			<Link href={viewLink}>
				<div
					className={cn(
						"flex w-fit items-center gap-2 rounded-sm px-2 py-1 text-xs hover:bg-accent dark:hover:bg-accent/30",
						{
							"border bg-accent dark:bg-accent/30": view.id === selectedViewId,
						},
					)}
				>
					<FolderKanbanIcon
						className="size-4 text-muted-foreground"
						style={{
							color: project?.color ?? undefined,
						}}
					/>
					{view.name}
				</div>
			</Link>
		</TaskViewContextMenu>
	);
};

export const TasksViewCreate = () => {
	const { setParams } = useTaskViewParams();
	const { viewId, filters, setFilters } = useTasksViewContext();

	// the view is only editable if it's not a default view
	const isEditable = !DEFAULT_VIEWS.find((v) => v.id === viewId);

	const initialFilters = useRef(filters);
	const hasFiltersChanged = useMemo(() => {
		console.log("comparing", initialFilters.current, filters);
		return JSON.stringify(initialFilters.current) !== JSON.stringify(filters);
	}, [filters]);

	const { mutate: updateView, isPending: isUpdating } = useMutation(
		trpc.taskViews.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.taskViews.get.queryOptions());
				initialFilters.current = filters;
				setFilters({ ...filters });
			},
		}),
	);

	return (
		<div className="flex gap-2">
			{hasFiltersChanged && isEditable && (
				<Button
					size="sm"
					variant="ghost"
					onClick={() =>
						updateView({
							id: viewId,
							filters: { ...filters },
						})
					}
					disabled={isUpdating}
				>
					<SaveAllIcon />
				</Button>
			)}
		</div>
	);
};
