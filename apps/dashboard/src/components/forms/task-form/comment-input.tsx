import { Textarea } from "@mimir/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { queryClient, trpc } from "@/utils/trpc";

export const CommentInput = ({ taskId }: { taskId: string }) => {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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
	};

	return (
		<div>
			<Textarea
				value={comment}
				ref={textareaRef}
				placeholder="Leave a comment..."
				onChange={(e) => setComment(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						handleSubmit(e);
					}
				}}
			/>
		</div>
	);
};
