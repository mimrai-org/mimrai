"use client";

import {
	mergeAttributes,
	Node,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { ToolCaseIcon } from "lucide-react";
import type { MentionItemRendererProps, ToolMentionEntity } from "./types";

/**
 * Tool mention list item renderer
 * Renders a tool in the mention suggestion dropdown
 */
export function ToolMentionListItem({
	entity,
}: MentionItemRendererProps<ToolMentionEntity>) {
	return (
		<>
			<ToolCaseIcon className="size-5" />
			<div className="text-left">
				<div className="truncate">{entity.name}</div>
			</div>
		</>
	);
}

/**
 * Tool mention node component
 * Renders the tool mention inline in the editor
 */
function ToolMentionNodeComponent({ node }: NodeViewProps) {
	const { id, label, name, description } = node.attrs;

	return (
		<NodeViewWrapper as="span" className="inline">
			<span
				className="inline-flex items-center gap-1 rounded-sm border bg-accent/50 px-1 py-0.5 align-middle font-medium text-sm"
				data-mention-type="tool"
				data-mention-id={id}
			>
				<ToolCaseIcon className="size-4" />
				<span>@{label || name}</span>
			</span>
		</NodeViewWrapper>
	);
}

/**
 * TipTap extension for tool mentions
 * Creates an inline node that renders the tool mention with icon
 */
export const ToolMentionExtension = Node.create({
	name: "toolMention",
	group: "inline",
	inline: true,
	selectable: true,
	atom: true,

	addAttributes() {
		return {
			id: {
				default: null as string | null,
			},
			label: {
				default: null as string | null,
			},
			name: {
				default: null as string | null,
			},
			description: {
				default: null as string | null,
			},
			color: {
				default: null as string | null,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-mention-type="tool"]',
			},
		];
	},

	renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
		return [
			"span",
			mergeAttributes(
				{
					"data-mention-type": "tool",
					class:
						"inline-flex items-center gap-1 rounded-sm border bg-accent/50 px-1 py-0.5 font-medium text-sm",
				},
				HTMLAttributes,
			),
			`@${HTMLAttributes.label}`,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(ToolMentionNodeComponent);
	},
});
