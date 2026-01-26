"use client";

import type { SuggestionProps } from "@tiptap/suggestion";
import { LayersIcon, UserIcon } from "lucide-react";
import { useEffect, useImperativeHandle, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TaskMentionListItem } from "./task-mention";
import type { AnyMentionEntity, MentionEntityType } from "./types";
import { UserMentionListItem } from "./user-mention";

/**
 * Group configuration for the unified mention dropdown
 */
interface MentionGroup {
	type: MentionEntityType;
	label: string;
	icon: React.ElementType;
}

const mentionGroups: MentionGroup[] = [
	{ type: "user", label: "Members", icon: UserIcon },
	{ type: "task", label: "Tasks", icon: LayersIcon },
];

/**
 * Render the appropriate list item based on entity type
 */
function MentionItemRenderer({
	entity,
	isSelected,
}: {
	entity: AnyMentionEntity;
	isSelected: boolean;
}) {
	switch (entity.type) {
		case "user":
			return <UserMentionListItem entity={entity} isSelected={isSelected} />;
		case "task":
			return <TaskMentionListItem entity={entity} isSelected={isSelected} />;
		default:
			return <span>{entity.label}</span>;
	}
}

interface UnifiedMentionListProps extends SuggestionProps<AnyMentionEntity> {}

export function UnifiedMentionList(props: UnifiedMentionListProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const items = useMemo(() => props.items, [props.items]);

	// Group items by type
	const groupedItems = useMemo(() => {
		const groups: Record<MentionEntityType, AnyMentionEntity[]> = {
			user: [],
			task: [],
			project: [],
			milestone: [],
		};

		for (const item of items) {
			groups[item.type].push(item);
		}

		return groups;
	}, [items]);

	// Flatten items for index-based navigation
	const flatItems = useMemo(() => {
		const result: AnyMentionEntity[] = [];
		for (const group of mentionGroups) {
			result.push(...groupedItems[group.type]);
		}
		return result;
	}, [groupedItems]);

	const handleSelect = (index: number) => {
		const item = flatItems[index];
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
		setSelectedIndex((selectedIndex + flatItems.length - 1) % flatItems.length);
	};

	const downHandler = () => {
		setSelectedIndex((selectedIndex + 1) % flatItems.length);
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

	// Calculate the flat index for each item
	const getFlatIndex = (type: MentionEntityType, indexInGroup: number) => {
		let offset = 0;
		for (const group of mentionGroups) {
			if (group.type === type) {
				return offset + indexInGroup;
			}
			offset += groupedItems[group.type].length;
		}
		return offset + indexInGroup;
	};

	const hasAnyItems = flatItems.length > 0;

	return (
		<div className="relative max-h-[300px] min-w-[250px] overflow-auto rounded-md border bg-popover py-2 shadow-md">
			{!hasAnyItems ? (
				<div className="px-4 py-2 text-muted-foreground text-sm">
					No results found
				</div>
			) : (
				<div className="w-full space-y-2">
					{mentionGroups.map((group) => {
						const groupItems = groupedItems[group.type];
						if (groupItems.length === 0) return null;

						const GroupIcon = group.icon;

						return (
							<div key={group.type}>
								<div className="flex items-center gap-2 px-3 py-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
									<GroupIcon className="size-3" />
									{group.label}
								</div>
								{groupItems.map((item, indexInGroup) => {
									const flatIndex = getFlatIndex(group.type, indexInGroup);
									return (
										<button
											key={item.id}
											type="button"
											className={cn(
												"flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
												{
													"bg-accent text-accent-foreground":
														selectedIndex === flatIndex,
												},
											)}
											onMouseEnter={() => setSelectedIndex(flatIndex)}
											onClick={() => handleSelect(flatIndex)}
										>
											<MentionItemRenderer
												entity={item}
												isSelected={selectedIndex === flatIndex}
											/>
										</button>
									);
								})}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
