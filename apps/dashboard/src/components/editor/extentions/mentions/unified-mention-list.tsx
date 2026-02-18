"use client";

import { useQuery } from "@tanstack/react-query";
import type { SuggestionProps } from "@tiptap/suggestion";
import {
	FileTextIcon,
	LayersIcon,
	Loader2Icon,
	ToolCaseIcon,
	UserIcon,
} from "lucide-react";
import {
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { useDebounceValue } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { DocumentMentionListItem } from "./document-mention";
import {
	documentsQueryOptions,
	selectDocuments,
	selectTasks,
	selectTools,
	selectUsers,
	tasksQueryOptions,
	toolsQueryOptions,
	usersQueryOptions,
} from "./mention-configs";
import { TaskMentionListItem } from "./task-mention";
import { ToolMentionListItem } from "./tool-mention";
import type { AnyMentionEntity, MentionEntityType } from "./types";
import { UserMentionListItem } from "./user-mention";

const DEBOUNCE_MS = 300;

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
	{ type: "document", label: "Documents", icon: FileTextIcon },
	{ type: "tool", label: "Tools", icon: ToolCaseIcon },
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
		case "document":
			return (
				<DocumentMentionListItem entity={entity} isSelected={isSelected} />
			);
		case "tool":
			return <ToolMentionListItem entity={entity} isSelected={isSelected} />;
		default:
			return <span>{entity.label}</span>;
	}
}

interface UnifiedMentionListProps extends SuggestionProps<AnyMentionEntity> {}

export function UnifiedMentionList(props: UnifiedMentionListProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const previousResultsSignatureRef = useRef("");

	const query = props.query;
	const [debouncedQuery] = useDebounceValue(query, DEBOUNCE_MS);

	// Fetch users — the member list rarely changes, so we fetch once
	// and filter client-side by the debounced query.
	const { data: users = [] } = useQuery({
		...usersQueryOptions(),
		select: (members) => selectUsers(members, debouncedQuery),
		staleTime: 60_000,
	});

	// Fetch tasks — the search is server-side, keyed by debounced query.
	const { data: tasks = [] } = useQuery({
		...tasksQueryOptions(debouncedQuery),
		select: selectTasks,
	});

	// Fetch documents — search is server-side, keyed by debounced query.
	const { data: documents = [] } = useQuery({
		...documentsQueryOptions(debouncedQuery),
		select: selectDocuments,
	});

	// Fetch tools — tool list is static per session, filter client-side.
	const { data: tools = [] } = useQuery({
		...toolsQueryOptions(),
		select: (data) => selectTools(data, debouncedQuery),
		staleTime: 60_000,
	});

	// Group items by type
	const groupedItems = useMemo(() => {
		const groups: Record<MentionEntityType, AnyMentionEntity[]> = {
			user: users,
			task: tasks,
			document: documents,
			project: [],
			milestone: [],
			tool: tools,
		};

		return groups;
	}, [users, tasks, documents, tools]);

	// Flatten items for index-based navigation
	const flatItems = useMemo(() => {
		const result: AnyMentionEntity[] = [];
		for (const group of mentionGroups) {
			result.push(...groupedItems[group.type]);
		}
		return result;
	}, [groupedItems]);
	const resultsSignature = useMemo(
		() => flatItems.map((item) => item.id).join("|"),
		[flatItems],
	);

	useEffect(() => {
		if (!containerRef.current || flatItems.length === 0) return;
		const selectedItem = flatItems[selectedIndex];
		if (!selectedItem) return;
		const itemElement = containerRef.current.querySelector(
			`[data-item-id="${selectedItem.id}"]`,
		) as HTMLElement | null;
		itemElement?.scrollIntoView({ block: "nearest" });
	}, [selectedIndex, flatItems]);

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

	// Reset selection when query results change
	useEffect(() => {
		if (previousResultsSignatureRef.current === resultsSignature) return;
		previousResultsSignatureRef.current = resultsSignature;
		setSelectedIndex(0);
	}, [resultsSignature]);

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
	const isInitialLoad =
		users.length === 0 &&
		tasks.length === 0 &&
		documents.length === 0 &&
		tools.length === 0;

	return (
		<div
			ref={containerRef}
			className="relative max-h-[300px] min-w-[250px] max-w-[500px] overflow-auto rounded-md border bg-popover py-2 shadow-md"
		>
			{!hasAnyItems ? (
				<div className="flex items-center gap-2 px-4 py-2 text-muted-foreground text-sm">
					{isInitialLoad ? (
						<>
							<Loader2Icon className="size-3.5 animate-spin" />
							Searching…
						</>
					) : (
						"No results found"
					)}
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
											data-item-id={item.id}
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
