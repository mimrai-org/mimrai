import type { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { BoldIcon, ItalicIcon, StrikethroughIcon } from "lucide-react";
import { useState } from "react";
import type { Props as TippyOptions } from "tippy.js";
import { BubbleMenuItem } from "./bubble-item";
import { InlineCommentItem } from "./inline-comment-item";
import { LinkItem } from "./link-item";

export function BubbleMenu({
	editor,
	taskId,
	tippyOptions,
}: {
	editor: Editor;
	taskId?: string;
	tippyOptions?: TippyOptions;
}) {
	const [openLink, setOpenLink] = useState(false);

	if (!editor) {
		return null;
	}

	return (
		<div>
			<TiptapBubbleMenu editor={editor}>
				<div className="flex h-9 w-fit max-w-[90vw] overflow-hidden rounded-full border border-border bg-background font-regular text-mono">
					<BubbleMenuItem
						editor={editor}
						action={() => editor.chain().focus().toggleBold().run()}
						isActive={editor.isActive("bold")}
					>
						<BoldIcon className="size-4" />
						<span className="sr-only">Bold</span>
					</BubbleMenuItem>

					<BubbleMenuItem
						editor={editor}
						action={() => editor.chain().focus().toggleItalic().run()}
						isActive={editor.isActive("italic")}
					>
						<ItalicIcon className="size-4" />
						<span className="sr-only">Italic</span>
					</BubbleMenuItem>

					<BubbleMenuItem
						editor={editor}
						action={() => editor.chain().focus().toggleStrike().run()}
						isActive={editor.isActive("strike")}
					>
						<StrikethroughIcon className="size-4" />
						<span className="sr-only">Strike</span>
					</BubbleMenuItem>

					<LinkItem editor={editor} open={openLink} setOpen={setOpenLink} />
					{taskId && <InlineCommentItem editor={editor} taskId={taskId} />}
				</div>
			</TiptapBubbleMenu>
		</div>
	);
}
