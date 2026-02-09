import {
	DndContext,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@ui/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import {
	CheckSquareIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	ListPlusIcon,
	PlusIcon,
} from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { usePanel } from "@/components/panels/panel-context";
import { TASK_PANEL_TYPE } from "@/components/panels/task-panel";
import { useTaskParams } from "@/hooks/use-task-params";
import { useTaskSelectionStore } from "@/store/task-selection";
import Loader from "../../loader";
import { TaskContextMenu } from "../../task-context-menu";
import type { PropertyKey } from "../properties/task-properties";
import { type GenericGroup, type Task, useTasksGrouped } from "../tasks-group";
import { useTasksViewContext } from "../tasks-view";
import { TaskListBulkActions } from "./bulk-actions";
import { TaskItem } from "./task-item";

const ESTIMATED_TASK_HEIGHT = 44;
const ESTIMATED_GROUP_HEADER_HEIGHT = 48;
const ESTIMATED_CREATE_BUTTON_HEIGHT = 44;

type VirtualItem =
	| { type: "group-header"; group: GenericGroup; taskCount: number }
	| { type: "task"; task: Task; groupId: string }
	| { type: "create-button"; groupId: string };

export const TasksList = () => {
	const { fetchNextPage, hasNextPage, isLoading, filters } =
		useTasksViewContext();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);

	const { tasks, reorderTask } = useTasksGrouped();

	// Get stable reference to panel opener - only this component subscribes to panel context
	const taskPanel = usePanel(TASK_PANEL_TYPE);
	const handleOpenTask = useCallback(
		(taskId: string) => {
			taskPanel.open(taskId);
		},
		[taskPanel],
	);

	// Memoize visible properties to prevent TaskItem rerenders
	const visibleProperties = useMemo(
		() => (filters.properties ?? []) as PropertyKey[],
		[filters.properties],
	);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	// Flatten groups and tasks into a single list for virtualization
	const flattenedItems = useMemo(() => {
		const items: VirtualItem[] = [];
		for (const taskGroup of Object.values(tasks)) {
			const isCollapsed = collapsedGroups.has(taskGroup.column.id);

			// Add group header
			items.push({
				type: "group-header",
				group: taskGroup.column,
				taskCount: taskGroup.tasks.length,
			});

			// Add tasks only if group is not collapsed
			if (!isCollapsed) {
				for (const task of taskGroup.tasks) {
					items.push({
						type: "task",
						task,
						groupId: taskGroup.column.id,
					});
				}
				// Add create button at end of group
				items.push({
					type: "create-button",
					groupId: taskGroup.column.id,
				});
			}
		}
		return items;
	}, [tasks, collapsedGroups]);

	const virtualizer = useVirtualizer({
		count: flattenedItems.length,
		getScrollElement: () => scrollContainerRef.current,
		estimateSize: (index) => {
			const item = flattenedItems[index];
			if (item.type === "group-header") return ESTIMATED_GROUP_HEADER_HEIGHT;
			if (item.type === "create-button") return ESTIMATED_CREATE_BUTTON_HEIGHT;
			return ESTIMATED_TASK_HEIGHT;
		},
		overscan: 10,
	});

	const toggleGroup = useCallback((groupId: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupId)) {
				next.delete(groupId);
			} else {
				next.add(groupId);
			}
			return next;
		});
	}, []);

	return (
		<>
			<DndContext
				sensors={sensors}
				onDragEnd={async ({ active, over }) => {
					if (!over) return;
					await reorderTask(
						active.id as string,
						over.id as string,
						over.id as string,
					);
				}}
			>
				<div
					ref={scrollContainerRef}
					className="h-[calc(100vh-140px)] overflow-y-auto overflow-x-hidden py-4"
				>
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const item = flattenedItems[virtualRow.index];
							return (
								<div
									key={virtualRow.key}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									{item.type === "group-header" && (
										<GroupHeader
											group={item.group}
											taskCount={item.taskCount}
											isCollapsed={collapsedGroups.has(item.group.id)}
											onToggle={() => toggleGroup(item.group.id)}
										/>
									)}
									{item.type === "task" && (
										<TaskContextMenu task={item.task}>
											<div>
												<TaskItem
													task={item.task}
													onOpenTask={handleOpenTask}
													visibleProperties={visibleProperties}
												/>
											</div>
										</TaskContextMenu>
									)}
									{item.type === "create-button" && (
										<CreateTaskButton groupId={item.groupId} />
									)}
								</div>
							);
						})}
					</div>
					{hasNextPage && (
						<div className="flex items-center justify-center py-2">
							<Button
								type="button"
								size={"sm"}
								variant="ghost"
								disabled={isLoading}
								onClick={() => fetchNextPage()}
							>
								{isLoading ? <Loader /> : <ListPlusIcon />}
								Load more
							</Button>
						</div>
					)}
				</div>
			</DndContext>
			<TaskListBulkActions />
		</>
	);
};

const GroupHeader = memo(function GroupHeader({
	group,
	taskCount,
	isCollapsed,
	onToggle,
}: {
	group: GenericGroup;
	taskCount: number;
	isCollapsed: boolean;
	onToggle: () => void;
}) {
	const setTaskSelection = useTaskSelectionStore(
		(state) => state.setTaskSelection,
	);
	const { tasks } = useTasksGrouped();

	const handleSelectAll = useCallback(() => {
		const groupTasks = tasks[group.name]?.tasks || [];
		const allTaskIds = groupTasks.map((task) => task.id);
		setTaskSelection(allTaskIds);
	}, [tasks, group.name, setTaskSelection]);

	const { setNodeRef: setDroppableNodeRef } = useDroppable({
		id: group.name,
	});

	return (
		<div ref={setDroppableNodeRef}>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<button
						type="button"
						data-state={isCollapsed ? "closed" : "open"}
						onClick={onToggle}
						className="group mb-2 flex w-full cursor-pointer items-center gap-2 rounded-sm border bg-card px-4 py-2 text-muted-foreground text-sm transition-colors hover:text-foreground dark:border-0 dark:bg-card"
					>
						<div className="text-muted-foreground group-hover:text-foreground">
							<ChevronRightIcon className="size-4 group-data-[state=open]:hidden" />
							<ChevronDownIcon className="hidden size-4 group-data-[state=open]:block" />
						</div>
						{group.icon}
						{group.name}
						<span className="rounded-sm border px-1 text-muted-foreground text-xs">
							{taskCount}
						</span>
					</button>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onSelect={handleSelectAll}>
						<CheckSquareIcon />
						Select {taskCount} tasks
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);
});

const CreateTaskButton = memo(function CreateTaskButton({
	groupId,
}: {
	groupId: string;
}) {
	const { filters } = useTasksViewContext();
	const { setParams: setTaskParams } = useTaskParams();

	const handleCreateTask = useCallback(() => {
		setTaskParams({
			createTask: true,
			taskStatusId: groupId,
			taskProjectId:
				filters.projectId?.length > 0 ? filters.projectId[0] : undefined,
		});
	}, [setTaskParams, groupId, filters.projectId]);

	return (
		<Button
			className="mb-2 w-full justify-start text-start text-muted-foreground text-xs"
			variant={"ghost"}
			onClick={handleCreateTask}
		>
			<PlusIcon className="size-3.5" />
			Create Task
		</Button>
	);
});
