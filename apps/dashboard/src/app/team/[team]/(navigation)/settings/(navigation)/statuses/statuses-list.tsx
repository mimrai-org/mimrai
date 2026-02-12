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
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { cn } from "@ui/lib/utils";
import { EllipsisIcon, GripVerticalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusIcon } from "@/components/status-icon";
import { useStatuses } from "@/hooks/use-data";
import { useStatusParams } from "@/hooks/use-status-params";
import { queryClient, trpc } from "@/utils/trpc";

type Status = {
	id: string;
	name: string;
	description: string | null;
	order: number;
	type: "done" | "to_do" | "backlog" | "in_progress" | "review";
};

const SortableStatusItem = ({
	status,
	isPending,
	setParams,
	onDelete,
}: {
	status: Status;
	isPending: boolean;
	setParams: ReturnType<typeof useStatusParams>["setParams"];
	onDelete: (id: string) => void;
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: status.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const gridClass = "grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4";

	return (
		<li
			ref={setNodeRef}
			style={style}
			className={cn(
				gridClass,
				"items-center border-b py-2 text-sm last:border-0",
				isDragging && "opacity-50",
			)}
		>
			<button
				type="button"
				className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
				{...attributes}
				{...listeners}
			>
				<GripVerticalIcon className="size-4" />
			</button>
			<span className="flex items-center gap-2">
				<StatusIcon className="inline size-4!" type={status.type} />
				{status.name}
			</span>
			<span className="text-muted-foreground">{status.description}</span>
			<span className="text-muted-foreground">
				{status.type.replaceAll("_", " ").toUpperCase()}
			</span>
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost">
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
		</li>
	);
};

export const StatusesList = () => {
	const { setParams } = useStatusParams();
	const { data } = useStatuses();
	const [items, setItems] = useState<Status[]>([]);

	// Keep local state in sync with server data
	const statuses = data?.data ?? [];
	if (
		statuses.length > 0 &&
		(items.length !== statuses.length ||
			statuses.some((s, i) => s.id !== items[i]?.id))
	) {
		setItems(statuses);
	}

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const { mutate: deleteStatus, isPending } = useMutation(
		trpc.statuses.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.statuses.get.queryOptions());
				toast.success("Status deleted successfully");
			},
		}),
	);

	const { mutate: reorderStatuses } = useMutation(
		trpc.statuses.reorder.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.statuses.get.queryOptions());
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

	const gridClass = "grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4";

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Statuses</CardTitle>
					<Button size="sm" onClick={() => setParams({ createStatus: true })}>
						<PlusIcon />
						Add Status
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<ul>
					<li
						className={cn(
							gridClass,
							"border-b pb-4 font-medium text-muted-foreground text-xs",
						)}
					>
						<span />
						<span>Name</span>
						<span>Description</span>
						<span>Type</span>
						<span />
					</li>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={items.map((s) => s.id)}
							strategy={verticalListSortingStrategy}
						>
							{items.map((status) => (
								<SortableStatusItem
									key={status.id}
									status={status}
									isPending={isPending}
									setParams={setParams}
									onDelete={(id) => deleteStatus({ id })}
								/>
							))}
						</SortableContext>
					</DndContext>
				</ul>
			</CardContent>
		</Card>
	);
};
