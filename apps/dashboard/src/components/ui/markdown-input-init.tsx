"use client";
import {
	BoldItalicUnderlineToggles,
	codeBlockPlugin,
	codeMirrorPlugin,
	headingsPlugin,
	InsertImage,
	imagePlugin,
	listsPlugin,
	MDXEditor,
	type MDXEditorMethods,
	type MDXEditorProps,
	markdownShortcutPlugin,
	quotePlugin,
	sandpackPlugin,
	thematicBreakPlugin,
	toolbarPlugin,
	UndoRedo,
} from "@mdxeditor/editor";
import type { ForwardedRef } from "react";
import "@mdxeditor/editor/style.css";
import { cn } from "@/lib/utils";

// Only import this to the next file
export default function InitializedMDXEditor({
	editorRef,
	...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
	return (
		<MDXEditor
			plugins={[
				toolbarPlugin({
					toolbarClassName: "rounded-none!",
					toolbarContents: () => {
						return (
							<div className="flex items-center gap-2 [&_svg]:size-5">
								<UndoRedo />
								<BoldItalicUnderlineToggles />
							</div>
						);
					},
				}),

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
					"[&_blockquote]:border-muted [&_blockquote]:border-l [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
					"[&_code]:rounded-sm [&_code]:bg-muted/50",
					"[&_p]:my-4",
					"[&_h1]:mt-4 [&_h1]:text-xl",
					"[&_h2]:mt-4 [&_h2]:text-lg",
					"[&_h3]:mt-4 [&_h3]:text-base",
					"[&_h4]:mt-4",
					"[&_h5]:mt-4",
					"[&_h6]:mt-4",
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
