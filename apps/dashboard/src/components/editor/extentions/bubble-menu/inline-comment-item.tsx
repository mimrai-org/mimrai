import type { Editor } from "@tiptap/react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { CommentInput } from "@/components/forms/task-form/comment-input";
import Loader from "@/components/loader";
import { BubbleMenuButton } from "./bubble-menu-button";

export const InlineCommentItem = ({
	editor,
	taskId,
	isActive,
}: {
	editor: Editor;
	taskId: string;
	isActive: boolean;
}) => {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const currentSelection = editor.state.selection;

	const handleSubmit = (commentId: string) => {
		editor
			.chain()
			.focus()
			.extendMarkRange("comment")
			.setMark("comment", { "data-id": commentId })
			.run();
		setLoading(false);
		setOpen(false);
	};

	if (isActive) return null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<div className="h-9">
					<BubbleMenuButton
						isActive={isActive}
						action={() => {
							setOpen(true);
						}}
						className="flex h-full items-center gap-2 text-sm!"
					>
						{loading ? (
							<Loader className="size-4" />
						) : (
							<MessageCircleIcon className="size-4" />
						)}
						Comment
					</BubbleMenuButton>
				</div>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-92 p-0" sideOffset={10}>
				<div className="w-full">
					<CommentInput
						autoFocus
						taskId={taskId}
						onSubmit={handleSubmit}
						onMutate={() => setLoading(true)}
						onBlur={() => setOpen(false)}
						className="border-0 dark:bg-background"
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
};
