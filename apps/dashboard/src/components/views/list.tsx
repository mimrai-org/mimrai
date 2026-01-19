"use client";
import type { RouterOutputs } from "@mimir/trpc";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FolderIcon, FolderKanbanIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { ProjectIcon } from "../project-icon";
import { useUser } from "../user-provider";
import { TaskViewContextMenu } from "./context-menu";
import { DEFAULT_VIEWS } from "./default-views";

export type TaskView = RouterOutputs["taskViews"]["get"]["data"][number];

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
			{DEFAULT_VIEWS.map((view) => (
				<ViewItem key={view.id} view={view} projectId={projectId} />
			))}
			<hr className="my-2" />
			{flatViews.map((view) => (
				<ViewItem key={view.id} view={view} projectId={projectId} />
			))}
		</div>
	);
};

export const ViewItem = ({
	view,
	projectId: propProjectId,
}: {
	view: TaskView;
	projectId?: string;
}) => {
	const user = useUser();
	const projectId = propProjectId ?? view.projectId;

	const viewLink = projectId
		? `${user.basePath}/projects/${projectId}/views/${view.id}`
		: `${user.basePath}/views/${view.id}`;

	return (
		<TaskViewContextMenu view={view}>
			<Link href={viewLink}>
				<div className="group flex items-center gap-2 rounded-sm px-4 py-2 text-sm hover:bg-accent dark:hover:bg-accent/30">
					<FolderKanbanIcon
						className="size-4 text-muted-foreground"
						style={{
							color: view.project?.color ?? undefined,
						}}
					/>
					<h3 className="font-medium">{view.name}</h3>
					<p className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
						{view.description}
					</p>

					<div className="ml-auto flex items-center gap-1">
						{view.project && (
							<div className="flex items-center gap-1 px-2 py-1 font-medium text-primary text-xs">
								<ProjectIcon {...view.project} className="size-3.5" />
								{view.project.name}
							</div>
						)}
					</div>
				</div>
			</Link>
		</TaskViewContextMenu>
	);
};
