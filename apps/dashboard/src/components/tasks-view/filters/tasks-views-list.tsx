"use client";
import { Context } from "@dnd-kit/sortable/dist/components";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
import { Input } from "@ui/components/ui/input";
import { cn } from "@ui/lib/utils";
import { vi } from "date-fns/locale";
import {
	LayersIcon,
	PencilIcon,
	SaveAllIcon,
	SaveIcon,
	TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { TaskViewForm } from "@/components/forms/task-view/form";
import type { TaskViewFormValues } from "@/components/forms/task-view/form-type";
import Loader from "@/components/loader";
import { useUser } from "@/components/user-provider";
import { queryClient, trpc } from "@/utils/trpc";
import { useTasksViewContext } from "../tasks-view";

export const TasksViewsList = ({ projectId }: { projectId: string }) => {
	const user = useUser();
	const { viewId } = useTasksViewContext();
	const { data: taskViews } = useQuery(
		trpc.taskViews.get.queryOptions({
			projectId,
			pageSize: 5,
		}),
	);

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
		<div className="mb-1 flex flex-wrap gap-2">
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
											"border bg-accent dark:bg-accent/30": view.id === viewId,
										},
									)}
								>
									<LayersIcon className="size-3.5 text-muted-foreground" />
									{view.name}
								</div>
							</Link>
						</ContextMenuTrigger>
						<ContextMenuContent>
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
		</div>
	);
};

export const TasksViewCreate = () => {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const user = useUser();
	const { viewId, filters, setFilters } = useTasksViewContext();

	const initialFilters = useRef(filters);
	const hasFiltersChanged = useMemo(() => {
		console.log("comparing", initialFilters.current, filters);
		return JSON.stringify(initialFilters.current) !== JSON.stringify(filters);
	}, [filters]);

	const { data: view, isFetched } = useQuery(
		trpc.taskViews.getById.queryOptions(
			{
				id: viewId!,
			},
			{
				enabled: !!viewId,
			},
		),
	);

	const onSubmit = (values: TaskViewFormValues) => {
		initialFilters.current = filters;
		setFilters({ ...filters });
		setOpen(false);
	};

	return (
		<div className="flex gap-2">
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create view</DialogTitle>
						<DialogDescription>
							Create a new task view to save your current filters and settings.
						</DialogDescription>
					</DialogHeader>

					{(isFetched || !viewId) && (
						<TaskViewForm
							onSubmit={onSubmit}
							defaultValues={{
								...view,
								description: view?.description || "",
								projectId: filters.projectId?.[0],
								viewType: filters.viewType || "list",
								filters: hasFiltersChanged ? { ...filters } : view?.filters,
							}}
						/>
					)}
				</DialogContent>
			</Dialog>
			{hasFiltersChanged && (
				<Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
					<SaveAllIcon />
				</Button>
			)}
		</div>
	);
};
