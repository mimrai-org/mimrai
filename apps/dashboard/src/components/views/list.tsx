"use client";
import type { RouterOutputs } from "@mimir/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FolderKanbanIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { useUser } from "../user-provider";

type View = RouterOutputs["taskViews"]["get"]["data"][number];

export const ViewsList = ({ projectId }: { projectId?: string }) => {
	const { data: views } = useInfiniteQuery(
		trpc.taskViews.get.infiniteQueryOptions(
			{
				projectId,
				pageSize: 20,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const flatViews = useMemo(() => {
		return views?.pages.flatMap((page) => page.data) ?? [];
	}, [views]);

	return (
		<div>
			{flatViews.map((view) => (
				<ViewItem key={view.id} view={view} projectId={projectId} />
			))}
		</div>
	);
};

export const ViewItem = ({
	view,
	projectId,
}: {
	view: View;
	projectId?: string;
}) => {
	const user = useUser();

	const viewLink = projectId
		? `${user.basePath}/projects/${projectId}/views/${view.id}`
		: `${user.basePath}/views/${view.id}`;

	return (
		<Link href={viewLink}>
			<div className="flex items-center gap-2 rounded-sm px-4 py-2 text-sm hover:bg-accent dark:hover:bg-accent/30">
				<FolderKanbanIcon className="size-4 text-muted-foreground" />
				<h3 className="font-medium">{view.name}</h3>
				<p>{view.description}</p>
			</div>
		</Link>
	);
};
