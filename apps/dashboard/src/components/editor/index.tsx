"use client";

import "./styles.css";

import {
	EditorContent,
	type Editor as EditorInstance,
	useEditor,
} from "@tiptap/react";
import { useEffect } from "react";
import { BubbleMenu } from "./extentions/bubble-menu";
import { registerExtensions } from "./extentions/register";

type EditorProps = {
	value?: string;
	placeholder?: string;
	autoFocus?: boolean;
	readOnly?: boolean;
	shouldInsertImage?: boolean;
	onUpdate?: (editor: EditorInstance) => void;
	onChange?: (value: string) => void;
	onBlur?: () => void;
	onFocus?: () => void;
	onUpload?: (fileUrl: string) => Promise<void>;
	onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;

	ref?: React.Ref<EditorInstance>;
	className?: string;
	tabIndex?: number;

	//** Only provide if this editor is associated with a specific task */
	taskId?: string;
};

export function Editor({
	value,
	placeholder,
	readOnly,
	shouldInsertImage,
	ref,
	onUpdate,
	onChange,
	onBlur,
	onFocus,
	onUpload,
	onKeyDown,
	autoFocus,
	className,
	tabIndex,
	taskId,
}: EditorProps) {
	const editor = useEditor(
		{
			extensions: registerExtensions({
				placeholder,
				onUpload,
				shouldInsertImage,
			}),
			content: value,
			contentType: "markdown",
			immediatelyRender: false,
			shouldRerenderOnTransaction: false,
			editable: !readOnly,
			onBlur,
			onFocus,
			autofocus: autoFocus,
			onUpdate: ({ editor }) => {
				// @ts-expect-error
				if (ref) ref.current = editor;
				onChange?.(editor.getMarkdown());
				onUpdate?.(editor);
			},
		},
		[],
	);

	useEffect(() => {
		if (editor) {
			const chain = editor.chain();
			if (autoFocus) chain.focus().setTextSelection(0);
			else chain.blur();
			chain.run();
		}
	}, [autoFocus, editor]);

	if (!editor) return null;

	return (
		<>
			<EditorContent
				editor={editor}
				className={className}
				tabIndex={tabIndex}
				onKeyDown={onKeyDown}
				autoFocus={autoFocus}
			/>
			<BubbleMenu editor={editor} taskId={taskId} />
		</>
	);
}
