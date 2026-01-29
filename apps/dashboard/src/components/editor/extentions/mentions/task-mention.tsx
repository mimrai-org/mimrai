"use client";

import { useQuery } from "@tanstack/react-query";
import {
	mergeAttributes,
	Node,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { CheckCircle2Icon, CircleIcon, Loader2Icon } from "lucide-react";
import { useTaskPanel } from "@/components/panels/task-panel";
import { StatusIcon } from "@/components/status-icon";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import type {
	MentionItemRendererProps,
	MentionNodeProps,
	TaskMentionEntity,
} from "./types";

/**
 * Task mention list item renderer
 * Renders a task in the mention suggestion dropdown
 */
export function TaskMentionListItem({
	entity,
}: MentionItemRendererProps<TaskMentionEntity>) {
	const isCompleted = entity.status === "done" || entity.completed;

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
	const taskPanel = useTaskPanel();

	// Fetch current task status - this ensures we always show the latest state
	const { data: task, isLoading } = useQuery(
		trpc.tasks.getById.queryOptions({
			id: id as string,
		}),
	);

	// Use fetched status, fallback to stored status only while loading
	const isCompleted = task?.status?.type === "done";
	const currentSequence = task?.sequence ?? sequence;

	return (
		<NodeViewWrapper
			as="button"
			type="button"
			className="inline"
			onClick={() => {
				taskPanel.open(task?.id);
			}}
		>
			<span
				className={cn(
					"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 align-middle font-medium text-sm transition-colors hover:bg-muted",
					isCompleted && "opacity-70",
				)}
				data-mention-type="task"
				data-mention-id={id}
			>
				{isLoading ? (
					<Loader2Icon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
				) : (
					<StatusIcon {...task.status} className="size-3.5 shrink-0" />
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
					{task?.title ?? label}
				</span>
			</span>
		</NodeViewWrapper>
	);
}

/**
 * Task mention node renderer for external use (read-only views)
 * Fetches current task status dynamically
 */
export function TaskMentionNode({ id, label, attrs }: MentionNodeProps) {
	const sequence = attrs.sequence as number | undefined;

	// Fetch current task status
	const { data: task, isLoading } = useQuery(
		trpc.tasks.getById.queryOptions({ id }),
	);

	const isCompleted = task?.status?.type === "done";
	const currentSequence = task?.sequence ?? sequence;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 font-medium text-sm",
				isCompleted && "opacity-70",
			)}
			data-mention-type="task"
			data-mention-id={id}
		>
			{isLoading ? (
				<Loader2Icon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
			) : isCompleted ? (
				<CheckCircle2Icon className="size-3.5 shrink-0 text-green-500" />
			) : (
				<CircleIcon className="size-3.5 shrink-0 text-muted-foreground" />
			)}
			{currentSequence && (
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
				{task?.title ?? label}
			</span>
		</span>
	);
}

/**
 * TipTap extension for task mentions
 * Creates an inline node that renders the task mention with checkbox and title
 * Note: Only id, label, and sequence are stored - status is fetched dynamically
 */
export const TaskMentionExtension = Node.create({
	name: "taskMention",
	group: "inline",
	inline: true,
	selectable: true,
	atom: true,

	addAttributes() {
		return {
			id: {
				default: null as string | null,
			},
			label: {
				default: null as string | null,
			},
			sequence: {
				default: null as number | null,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-mention-type="task"]',
			},
		];
	},

	renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
		// Note: We don't include status in HTML output since it's fetched dynamically
		return [
			"span",
			mergeAttributes(
				{
					"data-mention-type": "task",
					"data-mention-id": HTMLAttributes.id,
					class:
						"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 font-medium text-sm",
				},
				HTMLAttributes,
			),
			HTMLAttributes.sequence ? `#${HTMLAttributes.sequence} ` : "",
			HTMLAttributes.label,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(TaskMentionNodeComponent);
	},
});
