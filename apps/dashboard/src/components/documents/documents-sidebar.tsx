"use client";

import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import { Input } from "@ui/components/ui/input";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@ui/components/ui/sidebar";
import { Skeleton } from "@ui/components/ui/skeleton";
import { cn } from "@ui/lib/utils";
import {
	ChevronRightIcon,
	FilePlusIcon,
	FilesIcon,
	FileTextIcon,
	SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { ResourceIconRenderer } from "@/components/resource-icon/resource-icon-renderer";
import { useUser } from "@/components/user-provider";
import type { Document } from "@/hooks/use-data";
import { useDocuments } from "@/hooks/use-data";
import {
	invalidateDocumentQueries,
	optimisticUpdateDocument,
} from "@/store/entity-mutations";
import { trpc } from "@/utils/trpc";
import { DocumentContextMenu } from "./context-menu";
import { DocumentIcon } from "./document-icon";

// ─── Recursive tree item (works for all levels) ─────────────────────

function DocumentTreeItem({
	doc,
	expandedIds,
	onToggleExpand,
	depth = 0,
}: {
	doc: Document;
	expandedIds: Set<string>;
	onToggleExpand: (id: string) => void;
	depth?: number;
}) {
	const user = useUser();
	const pathname = usePathname();
	const hasChildren = doc.children?.length > 0;
	const isActive = pathname === `${user.basePath}/documents/${doc.id}`;
	const isExpanded = expandedIds.has(doc.id);

	const {
		listeners,
		attributes,
		setNodeRef: setDraggableRef,
		transform,
		isDragging,
	} = useDraggable({ id: doc.id });

	const { setNodeRef: setDroppableRef, isOver } = useDroppable({
		id: doc.id,
	});

	const {
		setNodeRef: setSeparatorDroppableAfterRef,
		isOver: isOverAfterSeparator,
	} = useDroppable({
		id: `${doc.id}-after-separator`,
	});

	const {
		setNodeRef: setSeparatorDroppableBeforeRef,
		isOver: isOverBeforeSeparator,
	} = useDroppable({
		id: `${doc.id}-before-separator`,
	});

	const childrenSorted = useMemo(() => {
		if (!doc.children) return [];
		return [...doc.children].sort((a, b) => a.order - b.order);
	}, [doc.children]);

	const isRoot = depth === 0;
	const Wrapper = isRoot ? SidebarMenuItem : SidebarMenuSubItem;
	const Button = isRoot ? SidebarMenuButton : SidebarMenuSubButton;
	const iconSize = isRoot ? "size-4" : "size-3.5";

	return (
		<>
			<div
				className={cn("relative h-px", {
					"bg-accent": isOverBeforeSeparator && !isDragging,
				})}
			>
				<div
					ref={setSeparatorDroppableBeforeRef}
					className={cn("-translate-y-1/2 absolute inset-0 h-4")}
				/>
			</div>
			<Wrapper
				className={
					isOver && !isDragging
						? "z-10 rounded-md bg-accent/50 ring-1 ring-accent-foreground/20"
						: ""
				}
			>
				<Collapsible
					open={isExpanded}
					onOpenChange={() => onToggleExpand(doc.id)}
				>
					<div className="flex items-center">
						<DocumentContextMenu document={doc}>
							<Button
								asChild
								isActive={isActive}
								ref={(node: HTMLElement | null) => {
									setDraggableRef(node);
									setDroppableRef(node);
								}}
								{...listeners}
								{...attributes}
								style={{
									transform: transform
										? `translate3d(${transform.x}px, ${transform.y}px, 0)`
										: undefined,
								}}
								className={cn("flex-1", {
									"pointer-events-none z-50 opacity-50": isDragging,
									"hover:bg-transparent dark:hover:bg-transparent": isOver,
								})}
							>
								<Link href={`${user.basePath}/documents/${doc.id}`}>
									<DocumentIcon
										icon={doc.icon}
										className={iconSize}
										hasChildren={hasChildren}
									/>
									<span className="truncate">
										{doc.name || "Untitled Document"}
									</span>
								</Link>
							</Button>
						</DocumentContextMenu>
						{hasChildren && (
							<CollapsibleTrigger asChild>
								<SidebarMenuAction>
									<ChevronRightIcon
										className={`size-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
									/>
								</SidebarMenuAction>
							</CollapsibleTrigger>
						)}
					</div>
					{hasChildren && (
						<CollapsibleContent className="overflow-visible!">
							<SidebarMenuSub className="gap-0.5">
								{childrenSorted.map((child) => (
									<DocumentTreeItem
										key={child.id}
										doc={child}
										expandedIds={expandedIds}
										onToggleExpand={onToggleExpand}
										depth={depth + 1}
									/>
								))}
							</SidebarMenuSub>
						</CollapsibleContent>
					)}
				</Collapsible>
			</Wrapper>
			<div
				className={cn("relative h-px", {
					"bg-accent": isOverAfterSeparator && !isDragging,
				})}
			>
				<div
					ref={setSeparatorDroppableAfterRef}
					className={cn("-translate-y-1/2 absolute inset-0 h-4")}
				/>
			</div>
		</>
	);
}

// ─── Main sidebar ────────────────────────────────────────────────────

export function DocumentsSidebar() {
	const user = useUser();
	const pathname = usePathname();
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounceValue(search, 300);

	// Extract the active document ID from the URL
	const activeDocumentId = useMemo(() => {
		const match = pathname.match(
			new RegExp(`${user.basePath}/documents/([^/]+)$`),
		);
		return match?.[1] ?? null;
	}, [pathname, user.basePath]);

	const { data, isLoading } = useDocuments(
		debouncedSearch
			? { search: debouncedSearch, pageSize: 50 }
			: {
					parentId: null,
					pageSize: 50,
				},
	);

	const dataSorted = useMemo(() => {
		if (!data) return [];
		return [...data.data].sort((a, b) => a.order - b.order);
	}, [data]);

	// Fetch the path of the active document to auto-expand ancestors
	const { data: documentPath } = useQuery({
		...trpc.documents.getPath.queryOptions({ id: activeDocumentId! }),
		enabled: Boolean(activeDocumentId),
	});

	// Track expanded folder IDs
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	// Auto-expand ancestors when navigating to a document
	useEffect(() => {
		if (documentPath && documentPath.length > 1) {
			setExpandedIds((prev) => {
				const next = new Set(prev);
				// Expand all ancestors (exclude the last item which is the document itself)
				for (const ancestor of documentPath.slice(0, -1)) {
					next.add(ancestor.id);
				}
				return next;
			});
		}
	}, [documentPath]);

	const onToggleExpand = useCallback((id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const rootDocs = useMemo(() => dataSorted ?? [], [dataSorted]);
	const [localItems, setLocalItems] = useState<Document[]>([]);

	// Sync server data into local state
	useEffect(() => {
		if (rootDocs.length > 0) {
			setLocalItems(rootDocs);
		}
	}, [rootDocs]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	const { mutate: createDocument, isPending: isPendingCreate } = useMutation(
		trpc.documents.create.mutationOptions({
			onMutate: () => {
				toast.loading("Creating document...", { id: "create-document" });
			},
			onSuccess: (doc) => {
				toast.success("Document created", { id: "create-document" });
				invalidateDocumentQueries();
				router.push(`${user.basePath}/documents/${doc.id}`);
			},
			onError: () => {
				toast.error("Failed to create document", { id: "create-document" });
			},
		}),
	);

	const { mutate: reorderDocuments } = useMutation(
		trpc.documents.reorder.mutationOptions({
			onSuccess: (docs) => {
				console.log("Reorder successful", docs);
				for (const doc of docs) {
					optimisticUpdateDocument(doc.id, doc);
				}
			},
			onError: () => {
				toast.error("Failed to reorder documents");
			},
		}),
	);

	// Find a document at any depth in the tree
	const findDocInTree = useCallback(
		(docs: Document[], id: string): Document | undefined => {
			for (const doc of docs) {
				if (doc.id === id) return doc;
				const found = findDocInTree(doc.children, id);
				if (found) return found;
			}
			return undefined;
		},
		[],
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		console.log({ active, over });

		if (!over || active.id === over.id) return;

		const draggedId = active.id as string;
		const overId = over.id as string;

		const draggedDoc = findDocInTree(localItems, draggedId);
		if (!draggedDoc) return;

		if (overId === "root") {
			// Dropping at root level → make it a root document
			reorderDocuments({
				items: [{ id: draggedId, order: 0, parentId: null }],
			});
		}

		if (overId.endsWith("-separator")) {
			// Dropping on a separator → reorder among siblings

			const separatorType = overId.includes("-before-") ? "before" : "after";
			const targetId = overId.replace(`-${separatorType}-separator`, "");
			const targetDoc = findDocInTree(localItems, targetId);
			if (!targetDoc) return;

			const targetParentId = targetDoc.parentId ?? null;
			const siblings = targetParentId
				? (findDocInTree(localItems, targetParentId)?.children ?? [])
				: localItems;

			const draggedIndex = siblings.findIndex((doc) => doc.id === draggedId);
			const targetIndex = siblings.findIndex((doc) => doc.id === targetId);
			if (targetIndex === -1) return;

			const updatedSiblings = [...siblings];

			if (draggedIndex !== -1) {
				// Same parent: remove from current position first
				updatedSiblings.splice(draggedIndex, 1);
			}

			// Recalculate target position after potential removal
			const adjustedTargetIndex = updatedSiblings.findIndex(
				(doc) => doc.id === targetId,
			);
			const newIndex =
				separatorType === "before"
					? adjustedTargetIndex
					: adjustedTargetIndex + 1;

			updatedSiblings.splice(newIndex, 0, {
				...draggedDoc,
				parentId: targetParentId,
			});

			// Update order for all siblings
			const reorderItems = updatedSiblings.map((doc, index) => ({
				id: doc.id,
				order: index,
				parentId: doc.parentId ?? null,
			}));

			reorderDocuments({ items: reorderItems });
			return;
		}

		const overDoc = findDocInTree(localItems, overId);
		if (overDoc) {
			// Dropping on another document → nest inside it
			reorderDocuments({
				items: [{ id: draggedId, order: 0, parentId: overId }],
			});
		}
	};

	const isCreateActive = pathname === `${user.basePath}/documents/create`;

	return (
		<>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								isActive={isCreateActive}
								onClick={() => {
									createDocument({
										name: "",
										content: "",
										parentId: undefined,
									});
								}}
							>
								<FilePlusIcon className="size-4" />
								<span>New Document</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarGroup className="flex-1">
				<SidebarGroupLabel>Documents</SidebarGroupLabel>
				<SidebarGroupContent className="flex flex-1 flex-col">
					<SidebarMenu className="flex-1">
						<SidebarMenuItem className="relative">
							<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-2 size-4 opacity-50" />
							<Input
								placeholder="Search documents..."
								value={search}
								variant="ghost"
								className="ps-8"
								onChange={(e) => setSearch(e.target.value)}
							/>
						</SidebarMenuItem>
						{isLoading &&
							Array.from({ length: 3 }).map((_, i) => (
								<SidebarMenuItem key={`skeleton-${i}`}>
									<div className="px-2 py-1.5">
										<Skeleton className="h-4 w-full" />
									</div>
								</SidebarMenuItem>
							))}

						<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
							<RootDroppable>
								{localItems.map((doc) => (
									<DocumentTreeItem
										key={doc.id}
										doc={doc}
										expandedIds={expandedIds}
										onToggleExpand={onToggleExpand}
									/>
								))}
							</RootDroppable>
						</DndContext>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</>
	);
}

export const RootDroppable = ({ children }: { children: React.ReactNode }) => {
	const { setNodeRef } = useDroppable({ id: "root" });

	return (
		<div ref={setNodeRef} className="size-full flex-1">
			{children}
		</div>
	);
};
