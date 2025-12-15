import { Textarea } from "@mimir/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import type { Editor as EditorInstance } from "@tiptap/react";
import { cn } from "@ui/lib/utils";
import { useRef, useState } from "react";
import { Editor } from "@/components/editor";
import { queryClient, trpc } from "@/utils/trpc";

export const CommentInput = ({
	taskId,
	replyTo,
	autoFocus = false,
	onSubmit,
	className,
	metadata,
}: {
	taskId: string;
	replyTo?: string;
	autoFocus?: boolean;
	className?: string;
	onSubmit?: (commentId: string) => void;
	metadata?: Record<string, string | number | boolean>;
}) => {
	const editorRef = useRef<EditorInstance | null>(null);
	const [comment, setComment] = useState("");

	const { mutate: commentTask } = useMutation(
		trpc.tasks.comment.mutationOptions({
			onSuccess: (newComment) => {
				if (!newComment) return;
				onSubmit?.(newComment.id);
				queryClient.invalidateQueries(
					trpc.activities.get.queryOptions({ groupId: replyTo ?? taskId }),
				);
				queryClient.invalidateQueries(
					trpc.activities.get.infiniteQueryOptions({
						groupId: replyTo ?? taskId,
					}),
				);

				// Invalidate after a delay to try to ensure a response is fetched
				setTimeout(() => {
					queryClient.invalidateQueries(
						trpc.activities.get.infiniteQueryOptions({
							groupId: newComment?.id,
						}),
					);
				}, 5000);
			},
		}),
	);

	const handleSubmit = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (comment.trim().length === 0) return;
		const mentions = parseMentions(editorRef.current?.getJSON() || {});
		commentTask({ id: taskId, comment, mentions, replyTo, metadata });

		setComment("");
		editorRef.current?.commands.clearContent();
		editorRef.current?.commands.focus();
	};

	const parseMentions = (data: any) => {
		const mentions: string[] = (data.content || []).flatMap(parseMentions);
		if (data.type === "mention") {
			mentions.push(data.attrs.id);
		}
		return mentions;
	};

	return (
		<div
			onKeyDown={(e) => {
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					handleSubmit(e);
				}
			}}
		>
			<Editor
				value={comment}
				ref={editorRef}
				autoFocus={autoFocus}
				onChange={(e) => setComment(e)}
				placeholder="Leave a comment..."
				className={cn(
					"rounded-sm border border-input bg-input px-4 py-2 dark:bg-input/30 [&_div]:min-h-[60px]",
					className,
				)}
			/>
		</div>
	);
};
