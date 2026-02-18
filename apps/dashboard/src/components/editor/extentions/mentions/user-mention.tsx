"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { createMentionNodeExtension } from "./mention-node-extension";
import type { MentionItemRendererProps, UserMentionEntity } from "./types";

/**
 * User mention list item renderer
 * Renders a user in the mention suggestion dropdown
 */
export function UserMentionListItem({
	entity,
}: MentionItemRendererProps<UserMentionEntity>) {
	return (
		<>
			<AssigneeAvatar
				name={entity.label}
				email={entity.email}
				image={entity.image}
				color={entity.color}
				className="size-5"
			/>
			<span className="truncate">{entity.label}</span>
		</>
	);
}

/**
 * User mention node component
 * Renders the user mention inline in the editor
 */
function UserMentionNodeComponent({ node }: NodeViewProps) {
	const { id, label, image } = node.attrs;

	return (
		<NodeViewWrapper as="span" className="inline">
			<span
				className="inline-flex items-center gap-1 rounded-sm border bg-accent/50 px-1 py-0.5 align-middle font-medium text-sm"
				data-mention-type="user"
				data-mention-id={id}
			>
				<AssigneeAvatar name={label} image={image} className="size-4" />
				<span>@{label}</span>
			</span>
		</NodeViewWrapper>
	);
}

/**
 * TipTap extension for user mentions
 * Creates an inline node that renders the user mention with avatar
 */
export const UserMentionExtension = createMentionNodeExtension({
	name: "userMention",
	entityName: "user",
	mentionType: "user",
	className:
		"inline-flex items-center gap-1 rounded-sm border bg-accent/50 px-1 py-0.5 font-medium text-sm",
	attributes: {
		id: {
			default: null as string | null,
		},
		label: {
			default: null as string | null,
		},
		image: {
			default: null as string | null,
		},
	},
	renderContent: (htmlAttributes) => `@${htmlAttributes.label ?? ""}`,
	nodeView: UserMentionNodeComponent,
});
