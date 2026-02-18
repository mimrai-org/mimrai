"use client";

import {
	mergeAttributes,
	Node,
	type NodeViewProps,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import type { ReactElement } from "react";
import type { MentionEntityType } from "./types";
import { getMarkdownTokenizerOptions } from "./utils";

type MentionAttributeDefaults = Record<
	string,
	{
		default: unknown;
	}
>;

type MentionRenderContent = string | number | Array<string | number>;

export function createMentionNodeExtension({
	name,
	entityName,
	mentionType,
	className,
	attributes,
	nodeView,
	renderContent,
	includeDataId = true,
}: {
	name: string;
	entityName: string;
	mentionType: MentionEntityType;
	className: string;
	attributes: MentionAttributeDefaults;
	nodeView: (props: NodeViewProps) => ReactElement;
	renderContent?: (
		htmlAttributes: Record<string, unknown>,
	) => MentionRenderContent;
	includeDataId?: boolean;
}) {
	return Node.create({
		name,
		group: "inline",
		inline: true,
		selectable: true,
		atom: true,

		addAttributes() {
			return attributes;
		},

		parseHTML() {
			return [
				{
					tag: `span[data-mention-type="${mentionType}"]`,
				},
			];
		},

		renderHTML({
			HTMLAttributes,
		}: {
			HTMLAttributes: Record<string, unknown>;
		}) {
			const baseAttributes: Record<string, unknown> = {
				"data-mention-type": mentionType,
				class: className,
			};

			if (includeDataId) {
				baseAttributes["data-mention-id"] = HTMLAttributes.id;
			}

			const content =
				renderContent?.(HTMLAttributes) ?? HTMLAttributes.label ?? "";
			const children = Array.isArray(content) ? content : [content];

			return [
				"span",
				mergeAttributes(baseAttributes, HTMLAttributes),
				...children,
			];
		},

		...getMarkdownTokenizerOptions({
			entityName,
		}),

		addNodeView() {
			return ReactNodeViewRenderer(nodeView);
		},
	});
}
