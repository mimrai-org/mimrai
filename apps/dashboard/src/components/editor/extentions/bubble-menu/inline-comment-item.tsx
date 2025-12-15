import type { Editor } from "@tiptap/react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { CommentInput } from "@/components/forms/task-form/comment-input";
import { BubbleMenuButton } from "./bubble-menu-button";

export const InlineCommentItem = ({
	editor,
	taskId,
}: {
	editor: Editor;
	taskId: string;
}) => {
	const [open, setOpen] = useState(false);
	const isActive = editor.isActive("comment");
	const currentSelection = editor.state.selection;

	const handleSubmit = (commentId: string) => {
		editor
			.chain()
			.focus()
			.extendMarkRange("comment")
			.setMark("comment", { "data-id": commentId })
			.run();
	};

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
						<MessageCircleIcon className="size-4" />
						Comment
					</BubbleMenuButton>
				</div>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-92 border-0 p-0" sideOffset={10}>
				<div className="w-full">
					<CommentInput autoFocus taskId={taskId} onSubmit={handleSubmit} />
				</div>
			</PopoverContent>
		</Popover>
	);
};
