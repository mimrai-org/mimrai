"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { WrenchIcon } from "lucide-react";
import { createMentionNodeExtension } from "./mention-node-extension";
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
			<WrenchIcon className="size-4 text-muted-foreground" />
			<div className="text-left">
				<div className="truncate">{entity.label}</div>
			</div>
		</>
	);
}

/**
 * Tool mention node component
 * Renders the tool mention inline in the editor
 */
function ToolMentionNodeComponent({ node }: NodeViewProps) {
	const { id, label } = node.attrs;

	return (
		<NodeViewWrapper as="span" className="inline">
			<span
				className="inline-flex items-center gap-1 rounded-sm border bg-accent/50 px-1 py-0.5 align-middle font-medium text-sm"
				data-mention-type="tool"
				data-mention-id={id}
			>
				<WrenchIcon className="size-4" />
				<span>@{label}</span>
			</span>
		</NodeViewWrapper>
	);
}

/**
 * TipTap extension for tool mentions
 * Creates an inline node that renders the tool mention with icon
 */
export const ToolMentionExtension = createMentionNodeExtension({
	name: "toolMention",
	entityName: "tool",
	mentionType: "tool",
	className:
		"inline-flex items-center gap-1 rounded-sm border bg-accent/50 px-1 py-0.5 font-medium text-sm",
	attributes: {
		id: {
			default: null as string | null,
		},
		label: {
			default: null as string | null,
		},
	},
	renderContent: (htmlAttributes) => `@${htmlAttributes.label ?? ""}`,
	nodeView: ToolMentionNodeComponent,
});
