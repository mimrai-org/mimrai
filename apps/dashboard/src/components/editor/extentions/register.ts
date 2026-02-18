// You can find the list of extensions here: https://tiptap.dev/docs/editor/extensions/functionality

import { getApiUrl } from "@mimir/utils/envs";
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import { ListKit } from "@tiptap/extension-list";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import { mergeAttributes } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CommentMark } from "./comment-mark";
import { DocumentMentionExtension } from "./mentions/document-mention";
import { buildUnifiedSuggestionOptions } from "./mentions/mention-suggestions";
import { TaskMentionExtension } from "./mentions/task-mention";
import { ToolMentionExtension } from "./mentions/tool-mention";
import { UserMentionExtension } from "./mentions/user-mention";

// Add your extensions here
const extensions = ({
	onUpload,
	onMention,
	shouldInsertImage,
}: {
	onUpload?: (fileUrl: string) => Promise<void>;
	onMention?: (id: string, label: string, type: string) => void;
	shouldInsertImage?: boolean;
}) => [
	StarterKit,
	Image.configure({
		inline: true,
		resize: {
			enabled: true,
			directions: ["top", "right", "bottom", "left"],
			minWidth: 50,
			minHeight: 50,
			alwaysPreserveAspectRatio: true,
		},
	}),
	Markdown,
	TableKit,
	ListKit,
	// Custom mention node extensions for rendering mentions as React components
	UserMentionExtension,
	TaskMentionExtension,
	DocumentMentionExtension,
	ToolMentionExtension,
	// Unified mention extension with single @ trigger for all entity types
	Mention.configure({
		renderHTML: ({ options, node }) => {
			return [
				"span",
				mergeAttributes(
					{
						class: "border rounded-sm py-0.5 px-1 font-medium",
						"data-mention-type": node.attrs.type,
					},
					options.HTMLAttributes,
				),
				`@${node.attrs.label}`,
			];
		},
		deleteTriggerWithBackspace: true,
		suggestion: buildUnifiedSuggestionOptions(onMention),
	}),
	CommentMark,

	FileHandler.configure({
		onDrop: async (currentEditor, files, pos) => {
			for (const file of files) {
				const formData = new FormData();
				formData.append("file", file);

				const response = await fetch(`${getApiUrl()}/api/attachments/upload`, {
					method: "POST",
					body: formData,
					credentials: "include",
				});

				const data = await response.json();
				const url = data.url as string;

				if (shouldInsertImage) {
					currentEditor
						.chain()
						.insertContentAt(pos, {
							type: "image",
							attrs: {
								src: url,
							},
						})
						.focus()
						.run();
				}

				onUpload?.(url);
			}
		},
		onPaste: async (currentEditor, files, htmlContent) => {
			for (const file of files) {
				if (htmlContent) {
					// if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
					// you could extract the pasted file from this url string and upload it to a server for example
					// console.log(htmlContent); // eslint-disable-line no-console
					return false;
				}

				const formData = new FormData();
				formData.append("file", file);

				const response = await fetch(`${getApiUrl()}/api/attachments/upload`, {
					method: "POST",
					body: formData,
					credentials: "include",
				});

				const data = await response.json();
				const url = data.url as string;

				if (shouldInsertImage) {
					currentEditor
						.chain()
						.insertContentAt(currentEditor.state.selection.anchor, {
							type: "image",
							attrs: {
								src: url,
							},
						})
						.focus()
						.run();
				}

				onUpload?.(url);
			}
		},
	}),
];

export function registerExtensions(options?: {
	placeholder?: string;
	onUpload?: (fileUrl: string) => Promise<void>;
	onMention?: (id: string, label: string, type: string) => void;
	shouldInsertImage?: boolean;
}) {
	const { placeholder, onUpload, shouldInsertImage, onMention } = options ?? {};
	return [
		...extensions({ onUpload, shouldInsertImage, onMention }),
		Placeholder.configure({ placeholder }),
	];
}
