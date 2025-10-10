// You can find the list of extensions here: https://tiptap.dev/docs/editor/extensions/functionality

import CodeBlock from "@tiptap/extension-code-block";
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

// Add your extensions here
const extensions = [
	StarterKit,
	Underline,
	Image,
	CodeBlock,
	Markdown,
	Link.configure({
		openOnClick: false,
		autolink: true,
		defaultProtocol: "https",
	}),

	FileHandler.configure({
		onDrop: (currentEditor, files, pos) => {
			const fileReader = new FileReader();
			for (const file of files) {
				fileReader.readAsDataURL(file);
				fileReader.onload = () => {
					currentEditor
						.chain()
						.insertContentAt(pos, {
							type: "image",
							attrs: {
								src: fileReader.result,
							},
						})
						.focus()
						.run();
				};
			}
		},
		onPaste: (currentEditor, files, htmlContent) => {
			for (const file of files) {
				if (htmlContent) {
					// if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
					// you could extract the pasted file from this url string and upload it to a server for example
					console.log(htmlContent); // eslint-disable-line no-console
					return false;
				}

				const fileReader = new FileReader();

				fileReader.readAsDataURL(file);
				fileReader.onload = () => {
					currentEditor
						.chain()
						.insertContentAt(currentEditor.state.selection.anchor, {
							type: "image",
							attrs: {
								src: fileReader.result,
							},
						})
						.focus()
						.run();
				};
			}
		},
	}),
];

export function registerExtensions(options?: { placeholder?: string }) {
	const { placeholder } = options ?? {};
	return [...extensions, Placeholder.configure({ placeholder })];
}
