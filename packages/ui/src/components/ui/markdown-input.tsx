"use client";
import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import { cn } from "@ui/lib/utils";
// ForwardRefEditor.tsx
import dynamic from "next/dynamic";
import { forwardRef } from "react";

// This is the only place InitializedMDXEditor is imported directly.
const Editor = dynamic(() => import("./markdown-input-init"), {
	// Make sure we turn SSR off
	ssr: false,
});

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
export const MarkdownInput = forwardRef<MDXEditorMethods, MDXEditorProps>(
	({ className, contentEditableClassName, ...props }, ref) => (
		<Editor
			className={cn("w-full text-sm", className)}
			contentEditableClassName={cn("font-sans", contentEditableClassName)}
			{...props}
			editorRef={ref}
		/>
	),
);

// TS complains without the following line
MarkdownInput.displayName = "MarkdownInput";
