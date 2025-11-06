// You can find the list of extensions here: https://tiptap.dev/docs/editor/extensions/functionality

import { computePosition, flip, shift } from "@floating-ui/dom";
import { getApiUrl } from "@mimir/utils/envs";
import CodeBlock from "@tiptap/extension-code-block";
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { mergeAttributes, posToDOMRect, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { queryClient, trpc } from "@/utils/trpc";
import { MentionList } from "./mention-list";

const updatePosition = (editor, element) => {
	const virtualElement = {
		getBoundingClientRect: () =>
			posToDOMRect(
				editor.view,
				editor.state.selection.from,
				editor.state.selection.to,
			),
	};

	computePosition(virtualElement, element, {
		placement: "bottom-start",
		strategy: "fixed",
		middleware: [shift(), flip()],
	}).then(({ x, y, strategy }) => {
		element.style.width = "max-content";
		element.style.position = strategy;
		element.style.left = `${x}px`;
		element.style.top = `${y}px`;
	});
};

// Add your extensions here
const extensions = ({
	onUpload,
	onMention,
	shouldInsertImage,
}: {
	onUpload?: (fileUrl: string) => Promise<void>;
	onMention?: (id: string, label: string) => void;
	shouldInsertImage?: boolean;
}) => [
	StarterKit,
	Underline,
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
	CodeBlock,
	Markdown,
	Link.configure({
		openOnClick: false,
		autolink: true,
		defaultProtocol: "https",
	}),
	Mention.configure({
		renderHTML: ({ options, node }) => {
			return [
				"span",
				mergeAttributes(
					{
						class: "border py-0.5 px-1 font-medium",
					},
					options.HTMLAttributes,
				),
				`@${node.attrs.label}`,
			];
		},
		deleteTriggerWithBackspace: true,
		suggestion: {
			items: async ({ query }) => {
				const members = await queryClient.fetchQuery(
					trpc.teams.getMembers.queryOptions(),
				);
				return members
					.filter((member) =>
						member.name.toLowerCase().includes(query.toLowerCase()),
					)
					.slice(0, 5);
			},

			command: ({ props, editor, range }) => {
				if (props.id) onMention?.(props.id, props.label ?? "");
				editor
					.chain()
					.focus()
					.insertContentAt(range, {
						type: "mention",
						attrs: props,
					})
					.run();
			},

			render: () => {
				let component: ReactRenderer | null = null;

				return {
					onStart: (props) => {
						component = new ReactRenderer(MentionList, {
							props,
							editor: props.editor,
						});
						if (!props.clientRect) {
							return;
						}
						component.element.style.position = "fixed";
						component.element.style.zIndex = "50";
						component.element.style.pointerEvents = "auto";
						document.body.appendChild(component.element);

						updatePosition(props.editor, component.element);
					},

					onUpdate: (props) => {
						component?.updateProps(props);
						if (!props.clientRect) {
							return;
						}
						updatePosition(props.editor, component?.element);
					},

					onKeyDown: (props) => {
						if (props.event.key === "Escape") {
							component?.destroy();
							return true;
						}
						// @ts-expect-error
						return component?.ref?.onKeyDown(props) ?? false;
					},

					onExit: () => {
						component?.element.remove();
						component?.destroy();
					},
				};
			},
		},
	}),

	FileHandler.configure({
		onDrop: async (currentEditor, files, pos) => {
			const fileReader = new FileReader();
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
				// fileReader.readAsDataURL(file);
				// fileReader.onload = () => {
				//   currentEditor
				//     .chain()
				//     .insertContentAt(pos, {
				//       type: "image",
				//       attrs: {
				//         src: fileReader.result,
				//       },
				//     })
				//     .focus()
				//     .run();
				// };
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

				// const fileReader = new FileReader();

				// fileReader.readAsDataURL(file);
				// fileReader.onload = () => {
				//   currentEditor
				//     .chain()
				//     .insertContentAt(currentEditor.state.selection.anchor, {
				//       type: "image",
				//       attrs: {
				//         src: fileReader.result,
				//       },
				//     })
				//     .focus()
				//     .run();
				// };
			}
		},
	}),
];

export function registerExtensions(options?: {
	placeholder?: string;
	onUpload?: (fileUrl: string) => Promise<void>;
	onMention?: (id: string, label: string) => void;
	shouldInsertImage?: boolean;
}) {
	const { placeholder, onUpload, shouldInsertImage, onMention } = options ?? {};
	return [
		...extensions({ onUpload, shouldInsertImage, onMention }),
		Placeholder.configure({ placeholder }),
	];
}
