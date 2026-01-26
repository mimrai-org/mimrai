"use client";

import "./styles.css";

import {
	EditorContent,
	type Editor as EditorInstance,
	type JSONContent,
	useEditor,
} from "@tiptap/react";
import { useEffect, useLayoutEffect, useRef } from "react";
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
			immediatelyRender: false,
			editable: !readOnly,
			onBlur,
			onFocus,
			autofocus: autoFocus,
			onUpdate: ({ editor }) => {
				// @ts-expect-error
				if (ref) ref.current = editor;
				onChange?.(editor.getHTML());
				onUpdate?.(editor);
			},
		},
		[],
	);

	if (!editor) return null;

	return (
		<>
			<EditorContent
				editor={editor}
				className={className}
				tabIndex={tabIndex}
				autoFocus={autoFocus}
			/>
			<BubbleMenu editor={editor} taskId={taskId} />
		</>
	);
}
