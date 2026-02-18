"use client";

import { Skeleton } from "@mimir/ui/skeleton";
import { FileTextIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/user-provider";
import { useDocuments } from "@/hooks/use-data";
import { ResourceIconRenderer } from "../resource-icon/resource-icon-renderer";
import { DocumentContextMenu } from "./context-menu";

export function DocumentChildren({ documentId }: { documentId: string }) {
	const user = useUser();
	const { data, isLoading } = useDocuments(
		{
			parentId: documentId,
			pageSize: 50,
		},
		{
			refetchOnMount: true,
			staleTime: 1000, // 1 minute
		},
	);

	const children = data?.data ?? [];

	if (isLoading) {
		return (
			<div className="space-y-1 px-4 py-2">
				<span className="text-muted-foreground text-xs">Children</span>
				<div className="space-y-1">
					{Array.from({ length: 2 }).map((_, i) => (
						<Skeleton key={`skeleton-${i}`} className="h-8 w-full" />
					))}
				</div>
			</div>
		);
	}

	if (children.length === 0) return null;

	return (
		<div className="space-y-1 px-4 pt-2 pb-4">
			<span className="text-muted-foreground text-xs">
				Children ({children.length})
			</span>
			<ul className="space-y-0.5">
				{children.map((child) => {
					const hasChildren = child.children?.length > 0;
					return (
						<li key={child.id}>
							<DocumentContextMenu document={child}>
								<Link
									href={`${user.basePath}/documents/${child.id}`}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
								>
									<ResourceIconRenderer
										iconKey={child.icon}
										fallback={hasChildren ? FolderIcon : FileTextIcon}
										size="size-4"
									/>
									<span className="truncate">
										{child.name || "Untitled Document"}
									</span>
								</Link>
							</DocumentContextMenu>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
