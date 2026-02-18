"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useQuery } from "@tanstack/react-query";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Skeleton } from "@ui/components/ui/skeleton";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { useMemo } from "react";
import { useTaskPanel } from "@/components/panels/task-panel";
import { StatusIcon } from "@/components/status-icon";
import { TaskContextMenu } from "@/components/task-context-menu";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { getCachedTaskFromList } from "./cache";
import { createMentionNodeExtension } from "./mention-node-extension";
import type { MentionItemRendererProps, TaskMentionEntity } from "./types";

/**
 * Task mention list item renderer
 * Renders a task in the mention suggestion dropdown
 */
export function TaskMentionListItem({
	entity,
}: MentionItemRendererProps<TaskMentionEntity>) {
	const isCompleted = Boolean(entity.completed);

	return (
		<>
			{isCompleted ? (
				<CheckCircle2Icon className="size-4 shrink-0 text-green-500" />
			) : (
				<CircleIcon className="size-4 shrink-0 text-muted-foreground" />
			)}
			{entity.sequence >= 0 && (
				<span className="shrink-0 text-muted-foreground text-xs">
					#{entity.sequence}
				</span>
			)}
			<span
				className={cn(
					"max-w-[400px] truncate",
					isCompleted && "text-muted-foreground line-through",
				)}
			>
				{entity.title}
			</span>
		</>
	);
}

/**
 * Task mention node component
 * Renders the task mention inline in the editor as a chip with checkbox and title
 * Fetches current task status dynamically to reflect real-time state changes
 */
function TaskMentionNodeComponent({ node }: NodeViewProps) {
	const { id, label, sequence } = node.attrs;
	const taskId = id as string;
	const taskPanel = useTaskPanel();
	const cachedTask = useMemo(() => getCachedTaskFromList(taskId), [taskId]);

	// Fetch current task status - this ensures we always show the latest state
	const { data: task, isLoading } = useQuery(
		trpc.tasks.getById.queryOptions({
			id: taskId,
		}),
	);

	// Use fetched status, fallback to stored status only while loading
	const isCompleted =
		task?.status?.type === "done" || Boolean(cachedTask?.completedAt);
	const currentSequence = task?.sequence ?? cachedTask?.sequence ?? sequence;
	const displayTaskTitle = task?.title ?? cachedTask?.title ?? label;
	const contextMenuTask = (task ?? cachedTask) as
		| RouterOutputs["tasks"]["get"]["data"][number]
		| undefined;
	const mentionContent = (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 align-middle font-medium text-sm transition-colors hover:bg-muted",
				isCompleted && "opacity-70",
			)}
			data-mention-type="task"
			data-mention-id={id}
		>
			{task?.status ? (
				<StatusIcon {...task.status} className="size-3.5 shrink-0" />
			) : isCompleted ? (
				<CheckCircle2Icon className="size-3.5 shrink-0 text-green-500" />
			) : (
				<CircleIcon className="size-3.5 shrink-0 text-muted-foreground" />
			)}
			{currentSequence >= 0 && (
				<span className="text-muted-foreground text-xs">
					#{currentSequence}
				</span>
			)}
			<span
				className={cn(
					"max-w-[350px] truncate",
					isCompleted && "text-muted-foreground line-through",
				)}
			>
				{displayTaskTitle}
			</span>
		</div>
	);

	return (
		<NodeViewWrapper
			as="button"
			type="button"
			className="inline"
			onClick={() => {
				taskPanel.open(task?.id ?? taskId);
			}}
		>
			{isLoading && !contextMenuTask ? (
				<Skeleton className="h-8 w-24 rounded-md" />
			) : contextMenuTask ? (
				<TaskContextMenu task={contextMenuTask}>
					{mentionContent}
				</TaskContextMenu>
			) : (
				mentionContent
			)}
		</NodeViewWrapper>
	);
}

/**
 * TipTap extension for task mentions
 * Creates an inline node that renders the task mention with checkbox and title
 * Note: Only id, label, and sequence are stored - status is fetched dynamically
 */
export const TaskMentionExtension = createMentionNodeExtension({
	name: "taskMention",
	entityName: "task",
	mentionType: "task",
	className:
		"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 font-medium text-sm",
	attributes: {
		id: {
			default: null as string | null,
		},
		label: {
			default: null as string | null,
		},
		sequence: {
			default: null as number | null,
		},
	},
	renderContent: (htmlAttributes) => [
		htmlAttributes.sequence ? `#${htmlAttributes.sequence} ` : "",
		String(htmlAttributes.label ?? ""),
	],
	nodeView: TaskMentionNodeComponent,
});
