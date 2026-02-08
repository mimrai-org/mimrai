"use client";

import {
	mergeAttributes,
	Node,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import type {
	MentionItemRendererProps,
	MentionNodeProps,
	UserMentionEntity,
} from "./types";

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
				name={entity.name}
				email={entity.email}
				image={entity.image}
				color={entity.color}
				className="size-5"
			/>
			<span className="truncate">{entity.name}</span>
		</>
	);
}

/**
 * User mention node component
 * Renders the user mention inline in the editor
 */
function UserMentionNodeComponent({ node }: NodeViewProps) {
	const { id, label, name, image, color, email } = node.attrs;

	return (
		<NodeViewWrapper as="span" className="inline">
			<span
				className="inline-flex items-center gap-1 rounded-sm border bg-accent/50 px-1 py-0.5 align-middle font-medium text-sm"
				data-mention-type="user"
				data-mention-id={id}
			>
				<AssigneeAvatar
					name={name || label}
					email={email}
					image={image}
					color={color}
					className="size-4"
				/>
				<span>@{label || name}</span>
			</span>
		</NodeViewWrapper>
	);
}

/**
 * TipTap extension for user mentions
 * Creates an inline node that renders the user mention with avatar
 */
export const UserMentionExtension = Node.create({
	name: "userMention",
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
			email: {
				default: null as string | null,
			},
			image: {
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
				tag: 'span[data-mention-type="user"]',
			},
		];
	},

	renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
		return [
			"span",
			mergeAttributes(
				{
					"data-mention-type": "user",
					class:
						"inline-flex items-center gap-1 rounded-sm border bg-accent/50 px-1 py-0.5 font-medium text-sm",
				},
				HTMLAttributes,
			),
			`@${HTMLAttributes.label}`,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(UserMentionNodeComponent);
	},
});
