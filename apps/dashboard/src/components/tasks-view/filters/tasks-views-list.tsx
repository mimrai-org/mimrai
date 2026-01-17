"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { cn } from "@ui/lib/utils";
import {
	FolderKanbanIcon,
	FolderPlusIcon,
	PencilIcon,
	SaveAllIcon,
	SaveIcon,
	TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { TaskViewForm } from "@/components/forms/task-view/form";
import { useUser } from "@/components/user-provider";
import { useTaskViewParams } from "@/hooks/use-task-view-params";
import { queryClient, trpc } from "@/utils/trpc";
import { useTasksViewContext } from "../tasks-view";

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

	// const { data: selectedView, isFetched} = useQuery(
	// 	trpc.taskViews.getById.queryOptions(
	// 		{
	// 			id: viewId!,
	// 		},
	// 		{
	// 			enabled: Boolean(viewId),
	// 		},
	// 	),
	// );

	const { mutate: deleteView } = useMutation(
		trpc.taskViews.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.taskViews.get.queryOptions());
			},
		}),
	);

	const { mutate: createView } = useMutation(
		trpc.taskViews.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.taskViews.get.queryOptions());
			},
		}),
	);

	return (
		<div>
			<div className="mb-1 flex flex-wrap gap-1">
				{taskViews?.data.map((view) => {
					return (
						<ContextMenu key={view.id}>
							<ContextMenuTrigger asChild>
								<Link
									href={`${user.basePath}/projects/${projectId}/views/${view.id}`}
								>
									<div
										className={cn(
											"flex w-fit items-center gap-1 rounded-sm px-2 py-1 text-xs hover:bg-accent dark:hover:bg-accent/30",
											{
												"border bg-accent dark:bg-accent/30":
													view.id === viewId,
											},
										)}
									>
										<FolderKanbanIcon className="size-3.5 text-muted-foreground" />
										{view.name}
									</div>
								</Link>
							</ContextMenuTrigger>
							<ContextMenuContent>
								<ContextMenuItem
									onSelect={() => {
										queryClient.setQueryData(
											trpc.taskViews.getById.queryKey({ id: view.id }),
											view,
										);
										setParams({
											viewId: view.id,
										});
									}}
								>
									<PencilIcon />
									Edit
								</ContextMenuItem>
								<ContextMenuItem
									onSelect={() => {
										createView({
											...view,
											name: `${view.name} Copy`,
											isDefault: false,
										});
									}}
								>
									<SaveIcon />
									Duplicate
								</ContextMenuItem>
								<ContextMenuItem
									variant="destructive"
									onSelect={() =>
										deleteView({
											id: view.id,
										})
									}
								>
									<TrashIcon />
									Delete
								</ContextMenuItem>
							</ContextMenuContent>
						</ContextMenu>
					);
				})}
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

export const TasksViewCreate = () => {
	const { setParams } = useTaskViewParams();
	const { viewId, filters, setFilters } = useTasksViewContext();

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
			{hasFiltersChanged && (
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
