import { Textarea } from "@mimir/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import type { Editor as EditorInstance } from "@tiptap/react";
import { useRef, useState } from "react";
import { Editor } from "@/components/editor";
import { queryClient, trpc } from "@/utils/trpc";

export const CommentInput = ({ taskId }: { taskId: string }) => {
	const editorRef = useRef<EditorInstance | null>(null);
	const [comment, setComment] = useState("");

	const { mutate: commentTask } = useMutation(
		trpc.tasks.comment.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.activities.get.queryOptions({ groupId: taskId }),
				);
			},
		}),
	);

	const handleSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (comment.trim().length === 0) return;
		commentTask({ id: taskId, comment });
		setComment("");
		editorRef.current?.commands.clearContent();
		editorRef.current?.commands.focus();
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
				autoFocus={false}
				onChange={(e) => setComment(e)}
				placeholder="Leave a comment..."
				className="min-h-16 border border-input bg-accent px-4 py-2"
			/>
		</div>
	);
};
