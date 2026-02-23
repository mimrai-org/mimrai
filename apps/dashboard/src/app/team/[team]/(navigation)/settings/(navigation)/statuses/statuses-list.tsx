"use client";
import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { DataSelectInput } from "@ui/components/ui/data-select-input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { cn } from "@ui/lib/utils";
import { EllipsisIcon, GripVerticalIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusIcon } from "@/components/status-icon";
import { useProjects, useStatuses } from "@/hooks/use-data";
import { useStatusParams } from "@/hooks/use-status-params";
import { queryClient, trpc } from "@/utils/trpc";

type Status = {
	id: string;
	name: string;
	description: string | null;
	order: number;
	projectIds: string[];
	type: "done" | "to_do" | "backlog" | "in_progress" | "review";
};

const SortableStatusItem = ({
	status,
	isPending,
	disableDrag,
	setParams,
	onDelete,
	projectNamesById,
}: {
	status: Status;
	isPending: boolean;
	disableDrag: boolean;
	setParams: ReturnType<typeof useStatusParams>["setParams"];
	onDelete: (id: string) => void;
	projectNamesById: Map<string, string>;
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: status.id, disabled: disableDrag });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const scopeText =
		status.projectIds.length === 0
			? "Global"
			: (() => {
					const names = status.projectIds.map(
						(projectId) => projectNamesById.get(projectId) ?? "Unknown project",
					);
					if (names.length <= 2) return names.join(", ");
					return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
				})();

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"flex items-center gap-4 rounded-sm px-4 py-2 text-sm hover:bg-accent dark:hover:bg-accent/30",
				isDragging && "opacity-50",
			)}
		>
			<button
				type="button"
				className={cn(
					"touch-none text-muted-foreground hover:text-foreground",
					disableDrag ? "cursor-not-allowed opacity-40" : "cursor-grab",
				)}
				{...(disableDrag ? {} : attributes)}
				{...(disableDrag ? {} : listeners)}
			>
				<GripVerticalIcon className="size-4" />
			</button>
			<div className="inline rounded bg-accent p-2 dark:bg-accent/30">
				<StatusIcon className="selft-center size-4" type={status.type} />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="font-medium">{status.name}</span>
				</div>
				<div className="truncate text-muted-foreground text-xs">
					{scopeText}
				</div>
			</div>
			<div className="text-muted-foreground text-xs uppercase tracking-wide">
				{status.type.replaceAll("_", " ")}
			</div>
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost" className="size-5">
							<EllipsisIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuGroup>
							<DropdownMenuItem
								onClick={() => {
									queryClient.setQueryData(
										trpc.statuses.getById.queryKey({ id: status.id }),
										status,
									);
									setParams({
										statusId: status.id,
									});
								}}
							>
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								variant="destructive"
								disabled={isPending || status.type === "backlog"}
								onClick={() => onDelete(status.id)}
							>
								Delete
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
};

export const StatusesList = () => {
	const { data } = useStatuses();
	const { data: projects } = useProjects();
	const { setParams } = useStatusParams();
	const [items, setItems] = useState<Status[]>([]);
	const [projectFilterId, setProjectFilterId] = useState<string | null>(null);

	// Keep local state in sync with server data
	const statuses = data?.data ?? [];
	if (
		statuses.length > 0 &&
		(items.length !== statuses.length ||
			statuses.some((s, i) => s.id !== items[i]?.id))
	) {
		setItems(statuses);
	}

	const projectNamesById = useMemo(() => {
		return new Map(
			(projects?.data ?? []).map((project) => [project.id, project.name]),
		);
	}, [projects?.data]);

	const filteredItems = useMemo(() => {
		if (!projectFilterId) return items;

		return items.filter(
			(status) =>
				status.projectIds.length === 0 ||
				status.projectIds.includes(projectFilterId),
		);
	}, [items, projectFilterId]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const { mutate: deleteStatus, isPending } = useMutation(
		trpc.statuses.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.statuses.get.queryKey(),
				});
				toast.success("Status deleted successfully");
			},
		}),
	);

	const { mutate: reorderStatuses } = useMutation(
		trpc.statuses.reorder.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.statuses.get.queryKey(),
				});
				toast.success("Statuses reordered successfully");
			},
			onError: () => {
				// Revert to server state on error
				if (data?.data) {
					setItems(data.data);
				}
				toast.error("Failed to reorder statuses");
			},
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		if (projectFilterId) {
			toast.message("Clear the project filter to reorder all statuses");
			return;
		}

		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = items.findIndex((item) => item.id === active.id);
			const newIndex = items.findIndex((item) => item.id === over.id);

			const newItems = arrayMove(items, oldIndex, newIndex);
			setItems(newItems);

			// Update order values and send to server
			const reorderedItems = newItems.map((item, index) => ({
				id: item.id,
				order: index,
			}));

			reorderStatuses({ items: reorderedItems });
		}
	};

	return (
		<div className="text-sm">
			<div className="mb-2 flex items-center">
				<DataSelectInput
					size="sm"
					className="w-64"
					queryOptions={trpc.projects.get.queryOptions(
						{},
						{
							select: (result) => result.data,
						},
					)}
					value={projectFilterId}
					onChange={(value) => setProjectFilterId(value || null)}
					getLabel={(item) => item?.name ?? ""}
					getValue={(item) => item?.id ?? ""}
					renderItem={(item) => item.name}
					placeholder="All projects"
					clearable
				/>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={filteredItems.map((s) => s.id)}
					strategy={verticalListSortingStrategy}
				>
					<div>
						{filteredItems.map((status) => (
							<SortableStatusItem
								key={status.id}
								status={status}
								isPending={isPending}
								disableDrag={Boolean(projectFilterId)}
								setParams={setParams}
								onDelete={(id) => deleteStatus({ id })}
								projectNamesById={projectNamesById}
							/>
						))}
						{filteredItems.length === 0 && (
							<div className="px-4 py-8 text-center text-muted-foreground">
								{projectFilterId
									? "No statuses available for this project"
									: "No statuses yet"}
							</div>
						)}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
};
