"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import { CommentInput } from "@/components/forms/task-form/comment-input";
import { queryClient, trpc } from "@/utils/trpc";
import { useZenMode } from "../use-zen-mode";
import { CommentContent } from "./comment-content";
import type { StackedComment } from "./use-inline-comments";

type InlineCommentItemProps = {
	comment: StackedComment;
	taskId: string;
	enableReply?: boolean;
	registerRef: (id: string, element: HTMLDivElement | null) => void;
	onHeightChange: () => void;
};

export const InlineCommentItem = ({
	comment,
	taskId,
	enableReply = true,
	registerRef,
	onHeightChange,
}: InlineCommentItemProps) => {
	const { editorRef, updateTask } = useZenMode();
	const [isReplying, setIsReplying] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isContentElementHovered, setIsContentElementHovered] = useState(false);
	const itemRef = useRef<HTMLDivElement>(null);

	// Track if we're in an interactive state (editing or replying)
	const isInteracting = isReplying || isEditing;

	// Combined hover state: hovered directly, content element hovered, or interacting
	const showHoverState = isHovered || isContentElementHovered || isInteracting;

	// Register ref on mount, unregister on unmount
	useEffect(() => {
		registerRef(comment.id, itemRef.current);
		return () => registerRef(comment.id, null);
	}, [comment.id, registerRef]);

	// Listen for hover on the content element (bidirectional hover)
	useEffect(() => {
		const contentElement = comment.element;
		if (!contentElement) return;

		const handleContentMouseEnter = () => {
			setIsContentElementHovered(true);
		};

		const handleContentMouseLeave = () => {
			setIsContentElementHovered(false);
		};

		contentElement.addEventListener("mouseenter", handleContentMouseEnter);
		contentElement.addEventListener("mouseleave", handleContentMouseLeave);

		return () => {
			contentElement.removeEventListener("mouseenter", handleContentMouseEnter);
			contentElement.removeEventListener("mouseleave", handleContentMouseLeave);
		};
	}, [comment.element]);

	const { data: replies } = useQuery(
		trpc.activities.get.queryOptions(
			{
				groupId: comment.id,
				type: ["task_comment"],
				nStatus: ["archived"],
				pageSize: 100,
			},
			{
				enabled: enableReply,
			},
		),
	);

	const hoverElementClass = "bg-primary text-primary-foreground";

	// Update content element hover state based on comment card hover
	useEffect(() => {
		if (!comment.element) return;

		if (showHoverState) {
			comment.element.classList.add(...hoverElementClass.split(" "));
		} else {
			comment.element.classList.remove(...hoverElementClass.split(" "));
		}
	}, [showHoverState, comment.element]);

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const handleSubmitReply = () => {
		queryClient.invalidateQueries(
			trpc.activities.get.queryOptions({
				groupId: comment.id,
				type: ["task_comment"],
				nStatus: ["archived"],
				pageSize: 100,
			}),
		);
		setIsReplying(false);
		// Trigger height recalculation after reply is added
		setTimeout(onHeightChange, 100);
	};

	const handleEditingChange = (editing: boolean) => {
		setIsEditing(editing);
	};

	const removeCommentFromEditor = () => {
		if (!editorRef.current) return;
		const editor = editorRef.current;

		// Unset the comment mark in the editor
		editor.commands.unsetCommentMark(comment.id);

		// Update the task description to remove the comment mark
		updateTask({
			id: taskId,
			description: editor.getHTML(),
		});

		// Remove hover class from the content element
		setIsHovered(false);
	};

	return (
		<div
			ref={itemRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={cn(
				"group pointer-events-auto absolute left-full ml-12 min-h-[56px] w-72 origin-left rounded-md border px-4 py-2 text-sm transition-all",
				showHoverState && "scale-102 bg-accent/50",
			)}
			style={{
				top: comment.calculatedTop,
			}}
		>
			<CommentContent
				activity={comment.activity}
				comment={comment.comment}
				taskId={taskId}
				onEditingChange={handleEditingChange}
				onDeleted={removeCommentFromEditor}
			/>

			{replies?.data && replies.data.length > 0 && (
				<div className="mt-2 space-y-4 border-t pt-4">
					{replies.data.map((reply) => (
						<CommentContent
							key={reply.id}
							activity={reply}
							comment={reply.metadata?.comment!}
							taskId={taskId}
							parentId={comment.id}
							compact
							onEditingChange={handleEditingChange}
						/>
					))}
				</div>
			)}

			{!isReplying && (
				<button
					type="button"
					className={cn(
						"text-muted-foreground text-xs transition-colors hover:text-foreground",
						showHoverState ? "opacity-100" : "opacity-0",
					)}
					onClick={() => setIsReplying(true)}
				>
					Reply
				</button>
			)}

			{isReplying && (
				<div className="mt-4">
					<CommentInput
						taskId={taskId}
						replyTo={comment.id}
						autoFocus
						onBlur={() => setIsReplying(false)}
						className="bg-transparent dark:bg-transparent"
						onSubmit={handleSubmitReply}
					/>
				</div>
			)}
		</div>
	);
};
