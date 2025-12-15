import {
	Mark,
	MarkViewContent,
	type MarkViewRendererProps,
	ReactMarkViewRenderer,
} from "@tiptap/react";

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
