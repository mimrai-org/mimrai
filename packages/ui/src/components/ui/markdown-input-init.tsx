"use client";
import {
	codeBlockPlugin,
	codeMirrorPlugin,
	headingsPlugin,
	imagePlugin,
	listsPlugin,
	MDXEditor,
	type MDXEditorMethods,
	type MDXEditorProps,
	markdownShortcutPlugin,
	quotePlugin,
	thematicBreakPlugin,
} from "@mdxeditor/editor";
import { cn } from "@ui/lib/utils";
import "@mdxeditor/editor/style.css";
import type { ForwardedRef } from "react";

// Only import this to the next file
export default function InitializedMDXEditor({
	editorRef,
	...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
	return (
		<MDXEditor
			plugins={[
				// Block-level plugins
				headingsPlugin(),
				listsPlugin(),
				quotePlugin(),
				thematicBreakPlugin(),
				imagePlugin(),

				// Code plugins
				codeBlockPlugin({
					defaultCodeBlockLanguage: "js",
				}),
				codeMirrorPlugin({
					codeBlockLanguages: {
						js: "JavaScript",
						ts: "TypeScript",
						jsx: "JSX",
						tsx: "TSX",
					},
				}),

				// Shortcuts
				markdownShortcutPlugin(),
			]}
			{...props}
			contentEditableClassName={cn(
				[
					"selection:bg-primary selection:text-primary-foreground",
					"[&_*]:dark:text-foreground",
					"[&_*]:font-sans",
					"[&_blockquote]:border-muted [&_blockquote]:border-l [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
					"[&_code]:rounded-sm [&_code]:bg-muted/50",
					"[&_p]:mb-4",
					"[&_h1]:my-2 [&_h1]:font-medium [&_h1]:text-xl",
					"[&_h2]:my-2 [&_h2]:font-medium [&_h2]:text-lg",
					"[&_h3]:my-2 [&_h3]:font-medium [&_h3]:text-base",
					"[&_h4]:my-2 [&_h4]:font-medium",
					"[&_h5]:my-2 [&_h5]:font-medium",
					"[&_h6]:my-2 [&_h6]:font-medium",
					"[&_li]:m-1!",
					"[&_ol]:list-decimal [&_ol]:pl-6",
					"[&_pre]:rounded-md [&_pre]:bg-muted/50 [&_pre]:p-4",
					"[&_ul]:list-disc [&_ul]:pl-6",
				].join(" "),
				props.contentEditableClassName,
			)}
			ref={editorRef}
		/>
	);
}
