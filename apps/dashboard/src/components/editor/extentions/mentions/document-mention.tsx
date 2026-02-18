"use client";

import { useQuery } from "@tanstack/react-query";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Skeleton } from "@ui/components/ui/skeleton";
import { FileTextIcon } from "lucide-react";
import { useMemo } from "react";
import { DocumentIcon } from "@/components/documents/document-icon";
import { useDocumentPanel } from "@/components/panels/document-panel";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { getCachedDocumentFromList } from "./cache";
import { createMentionNodeExtension } from "./mention-node-extension";
import type { DocumentMentionEntity, MentionItemRendererProps } from "./types";

export function DocumentMentionListItem({
	entity,
}: MentionItemRendererProps<DocumentMentionEntity>) {
	return (
		<>
			<DocumentIcon icon={entity.icon} className="size-4 shrink-0" />
			<span className="max-w-[400px] truncate">{entity.name}</span>
		</>
	);
}

function DocumentMentionNodeComponent({ node }: NodeViewProps) {
	const { id, label } = node.attrs;
	const documentId = id as string;
	const documentPanel = useDocumentPanel();
	const cachedDocument = useMemo(
		() => getCachedDocumentFromList(documentId),
		[documentId],
	);

	const { data: document, isLoading } = useQuery(
		trpc.documents.getById.queryOptions(
			{
				id: documentId,
			},
			{
				enabled: !cachedDocument,
			},
		),
	);
	const displayDocument = document ?? cachedDocument;

	return (
		<NodeViewWrapper
			as="button"
			type="button"
			className="inline"
			onClick={() => {
				documentPanel.open(documentId);
			}}
		>
			{isLoading && !displayDocument ? (
				<Skeleton className="h-8 w-24 rounded-md" />
			) : (
				<span
					className={cn(
						"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 align-middle font-medium text-sm transition-colors hover:bg-muted",
					)}
					data-mention-type="document"
					data-mention-id={id}
				>
					{displayDocument ? (
						<DocumentIcon
							icon={displayDocument.icon}
							className="size-3.5 shrink-0"
						/>
					) : (
						<FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
					)}
					<span className="max-w-[350px] truncate">
						{displayDocument?.name ?? label}
					</span>
				</span>
			)}
		</NodeViewWrapper>
	);
}

export const DocumentMentionExtension = createMentionNodeExtension({
	name: "documentMention",
	entityName: "document",
	mentionType: "document",
	className:
		"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 font-medium text-sm",
	attributes: {
		id: {
			default: null as string | null,
		},
		label: {
			default: null as string | null,
		},
		icon: {
			default: null as string | null,
		},
	},
	nodeView: DocumentMentionNodeComponent,
});
