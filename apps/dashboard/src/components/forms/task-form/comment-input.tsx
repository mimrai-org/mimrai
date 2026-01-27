import { useMutation } from "@tanstack/react-query";
import type { Editor as EditorInstance } from "@tiptap/react";
import { Button } from "@ui/components/ui/button";
import { Kbd, KbdGroup } from "@ui/components/ui/kbd";
import { cn } from "@ui/lib/utils";
import { CommandIcon, CornerDownLeft, CornerDownLeftIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Editor } from "@/components/editor";
import { queryClient, trpc } from "@/utils/trpc";

export const CommentInput = ({
	taskId,
	replyTo,
	autoFocus = false,
	onSubmit,
	onMutate,
	onBlur,
	className,
	metadata,
}: {
	taskId: string;
	replyTo?: string;
	autoFocus?: boolean;
	className?: string;
	onSubmit?: (commentId: string) => void;
	onMutate?: () => void;
	onBlur?: () => void;
	metadata?: Record<string, string | number | boolean>;
}) => {
	const [focused, setFocused] = useState(false);
	const editorRef = useRef<EditorInstance | null>(null);
	const [comment, setComment] = useState("");

	const { mutate: commentTask } = useMutation(
		trpc.tasks.comment.mutationOptions({
			onMutate: () => {
				onMutate?.();
			},
			onSettled: (newComment) => {
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

	const handleSubmit = () => {
		if (comment.replace(/\s|\n/g, "").length === 0) return;
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
				if (e.key === "Enter" && e.ctrlKey) {
					e.preventDefault();
					handleSubmit();
				}
			}}
			className="group relative"
		>
			<Editor
				value={comment}
				ref={editorRef}
				autoFocus={autoFocus}
				onChange={(e) => setComment(e)}
				onBlur={() => {
					setFocused(false);
					onBlur?.();
				}}
				onFocus={() => setFocused(true)}
				placeholder="Leave a comment..."
				className={cn(
					"rounded-sm border border-input px-4 py-2 [&_div]:min-h-[80px]",
					className,
				)}
			/>

			{focused && (
				<div className="fade-in absolute right-2 bottom-2 flex animate-in items-center gap-2">
					<Button
						size="sm"
						className="h-7"
						variant="ghost"
						onClick={() => {
							handleSubmit();
						}}
					>
						<span className="hidden">Submit</span>
						<KbdGroup>
							<Kbd className="bg-transparent text-current">
								<CommandIcon className="size-3.5" />
								<CornerDownLeftIcon className="size-3.5" />
							</Kbd>
						</KbdGroup>
					</Button>
				</div>
			)}
		</div>
	);
};
