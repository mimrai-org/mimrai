"use client";

import type { SuggestionProps } from "@tiptap/suggestion";
import { useEffect, useImperativeHandle, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
	AnyMentionEntity,
	MentionEntityConfig,
	MentionItemRendererProps,
} from "./types";

interface GenericMentionListProps<T extends AnyMentionEntity = AnyMentionEntity>
	extends SuggestionProps<T> {
	/** Configuration for the entity type */
	config: MentionEntityConfig<T>;
}

export function GenericMentionList<
	T extends AnyMentionEntity = AnyMentionEntity,
>(props: GenericMentionListProps<T>) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const { config } = props;

	const items = useMemo(() => props.items, [props.items]);

	const handleSelect = (index: number) => {
		const item = items[index];
		if (item) {
			props.command({
				id: item.id,
				label: item.label,
				type: item.type,
				...item.metadata,
			});
		}
	};

	const upHandler = () => {
		setSelectedIndex((selectedIndex + items.length - 1) % items.length);
	};

	const downHandler = () => {
		setSelectedIndex((selectedIndex + 1) % items.length);
	};

	const enterHandler = () => {
		handleSelect(selectedIndex);
	};

	useEffect(() => setSelectedIndex(0), [items]);

	// @ts-expect-error - TipTap's ref handling
	useImperativeHandle(props.ref, () => ({
		// @ts-expect-error - TipTap's event handling
		onKeyDown: ({ event }) => {
			if (event.key === "ArrowUp") {
				upHandler();
				return true;
			}

			if (event.key === "ArrowDown") {
				downHandler();
				return true;
			}

			if (event.key === "Enter") {
				enterHandler();
				return true;
			}

			if (event.key === "Tab") {
				event.preventDefault();
				event.stopPropagation();
				enterHandler();
				return true;
			}

			return false;
		},
	}));

	const ItemRenderer = config.listItemRenderer as React.ComponentType<
		MentionItemRendererProps<T>
	>;

	return (
		<div className="relative max-h-[300px] overflow-auto rounded-md border bg-popover shadow-md">
			{items.length === 0 ? (
				<div className="px-4 py-2 text-muted-foreground text-sm">
					{config.emptyPlaceholder ?? "No results found"}
				</div>
			) : (
				<div className="w-full">
					{items.map((item, index) => (
						<button
							key={item.id}
							type="button"
							className={cn(
								"flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
								{
									"bg-accent text-accent-foreground": selectedIndex === index,
								},
							)}
							onMouseEnter={() => setSelectedIndex(index)}
							onClick={() => handleSelect(index)}
						>
							<ItemRenderer
								entity={item}
								isSelected={selectedIndex === index}
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
