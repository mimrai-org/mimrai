import { computePosition, flip, shift } from "@floating-ui/dom";
import type { Editor } from "@tiptap/react";
import { posToDOMRect, ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import type { AnyMentionEntity, MentionEntityType } from "./types";
import { UnifiedMentionList } from "./unified-mention-list";

const updatePosition = (editor: Editor, element: HTMLElement) => {
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

/**
 * Determine the node type to insert based on entity type
 */
function getNodeTypeForEntity(type: MentionEntityType): string {
	switch (type) {
		case "user":
			return "userMention";
		case "task":
			return "taskMention";
		case "tool":
			return "toolMention";
		default:
			return "mention";
	}
}

/**
 * Build unified suggestion options for the @ mention trigger
 * Shows all entity types (users, tasks) in a single dropdown
 */
export function buildUnifiedSuggestionOptions(
	onMention?: (id: string, label: string, type: string) => void,
): Partial<SuggestionOptions<AnyMentionEntity>> {
	return {
		char: "@",
		allowSpaces: true,
		items: ({ query: _query }) => {
			// Data fetching is handled inside UnifiedMentionList via useQuery
			// with debounce and caching. We return an empty array here because
			// TipTap requires this callback, but the component manages its own data.
			return [];
		},
		command: ({ props, editor, range }) => {
			const entityType = props.type as MentionEntityType;

			if (props.id) {
				onMention?.(props.id as string, props.label ?? "", entityType);
			}

			const nodeType = getNodeTypeForEntity(entityType);

			editor
				.chain()
				.focus()
				.insertContentAt(range, {
					type: nodeType,
					attrs: {
						...props,
						mentionSuggestionChar: "@",
						type: entityType,
					},
				})
				.run();
		},
		render: () => {
			let component: ReactRenderer | null = null;

			return {
				onStart: (props) => {
					component = new ReactRenderer(UnifiedMentionList, {
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

					updatePosition(props.editor, component?.element!);
				},

				onKeyDown: (props) => {
					if (props.event.key === "Escape") {
						component?.destroy();
						return true;
					}
					// @ts-expect-error - TipTap's ref handling
					return component?.ref?.onKeyDown(props) ?? false;
				},

				onExit: () => {
					component?.element.remove();
					component?.destroy();
				},
			};
		},
	};
}

// Keep backward compatibility exports
export { buildUnifiedSuggestionOptions as buildAllSuggestionOptions };
