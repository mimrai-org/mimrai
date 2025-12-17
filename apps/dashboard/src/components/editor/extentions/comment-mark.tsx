import {
	type CommandProps,
	Mark,
	MarkViewContent,
	type MarkViewRendererProps,
	ReactMarkViewRenderer,
} from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		commentMark: {
			unsetCommentMark: (commentId: string) => ReturnType;
		};
	}
}

export const CommentMark = Mark.create(() => {
	return {
		name: "comment",
		inclusive: true,
		keepOnSplit: true,
		addAttributes() {
			return {
				"data-id": {
					default: null,
				},
			};
		},
		addMarkView() {
			return ReactMarkViewRenderer(CommentMarkComponent);
		},
		parseHTML() {
			return [
				{
					tag: "comment",
				},
			];
		},
		renderHTML({ HTMLAttributes }) {
			return ["comment", HTMLAttributes, 0];
		},

		addCommands() {
			return {
				unsetCommentMark:
					(commentId: string) =>
					({ editor, commands, chain }: CommandProps) => {
						const { state } = editor;
						const { tr } = state;
						const { doc } = tr;

						doc.descendants((node, pos) => {
							if (node.marks) {
								node.marks.forEach((mark) => {
									if (
										mark.type.name === "comment" &&
										mark.attrs["data-id"] === commentId
									) {
										chain()
											.focus()
											.setTextSelection(pos)
											.extendMarkRange("comment")
											.unsetMark("comment")
											.blur()
											.run();
									}
								});
							}
						});

						return true;
					},
			};
		},
	};
});

export const CommentMarkComponent = (props: MarkViewRendererProps) => {
	return (
		<span
			className="border-gray-300 border-b border-dashed"
			data-id={props.mark.attrs["data-id"]}
		>
			<MarkViewContent />
		</span>
	);
};
