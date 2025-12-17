import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import eq from "lodash/eq";
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

	const state = useEditorState({
		editor,
		selector: (ctx) => ({
			isBold: ctx.editor.isActive("bold"),
			isItalic: ctx.editor.isActive("italic"),
			isStrike: ctx.editor.isActive("strike"),
			isComment: ctx.editor.isActive("comment"),
		}),
		equalityFn: (prev, next) => {
			if (!next) return false;
			return eq(prev, next);
		},
	});

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
						isActive={state.isBold}
					>
						<BoldIcon className="size-4" />
						<span className="sr-only">Bold</span>
					</BubbleMenuItem>

					<BubbleMenuItem
						editor={editor}
						action={() => editor.chain().focus().toggleItalic().run()}
						isActive={state.isItalic}
					>
						<ItalicIcon className="size-4" />
						<span className="sr-only">Italic</span>
					</BubbleMenuItem>

					<BubbleMenuItem
						editor={editor}
						action={() => editor.chain().focus().toggleStrike().run()}
						isActive={state.isStrike}
					>
						<StrikethroughIcon className="size-4" />
						<span className="sr-only">Strike</span>
					</BubbleMenuItem>

					<LinkItem editor={editor} open={openLink} setOpen={setOpenLink} />
					{taskId && (
						<InlineCommentItem
							editor={editor}
							taskId={taskId}
							isActive={state.isComment}
						/>
					)}
				</div>
			</TiptapBubbleMenu>
		</div>
	);
}
