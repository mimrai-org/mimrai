"use client";

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { BoxIcon, LayersIcon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
	EmptyState,
	EmptyStateAction,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
} from "@/components/empty-state";
import { ProjectIcon } from "@/components/project-icon";
import { useProjectParams } from "@/hooks/use-project-params";
import { queryClient, trpc } from "@/utils/trpc";

export const ProjectsList = () => {
	const { setParams } = useProjectParams();
	const { data, isLoading } = useInfiniteQuery(
		trpc.projects.get.infiniteQueryOptions(
			{ pageSize: 20 },
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const { mutate: deleteProject, isPending: isDeleting } = useMutation(
		trpc.projects.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting project...", { id: "delete-project" });
			},
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				toast.success("Project deleted successfully", { id: "delete-project" });
			},
			onError: (error) => {
				toast.error("Failed to delete project", { id: "delete-project" });
			},
		}),
	);

	const listData = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) || [];
	}, [data]);

	if (listData.length === 0 && !isLoading) {
		return (
			<EmptyState>
				<EmptyStateIcon>
					<BoxIcon className="size-10" />
				</EmptyStateIcon>
				<EmptyStateTitle>No projects found</EmptyStateTitle>
				<EmptyStateDescription>
					You haven't created any projects yet. Projects help you organize your
					tasks and teams effectively.
				</EmptyStateDescription>
				<EmptyStateAction>
					<Button
						onClick={() => setParams({ createProject: true })}
						variant="default"
					>
						Create your first project
					</Button>
				</EmptyStateAction>
			</EmptyState>
		);
	}

	return (
		<ul className="w-full">
			{listData.map((project) => (
				<ContextMenu key={project.id}>
					<ContextMenuTrigger asChild>
						<li
							className="flex w-full justify-between border-b p-4 text-sm transition-colors last:border-0 hover:bg-muted"
							onClick={() => {
								queryClient.setQueryData(
									trpc.projects.getById.queryKey({ id: project.id }),
									project,
								);
								setParams({ projectId: project.id });
							}}
						>
							<div className="flex items-center gap-2">
								<ProjectIcon className="size-4" color={project.color} />
								<h3 className="font-medium">{project.name}</h3>
							</div>
							<div className="flex items-center gap-4">
								<div className="w-48">
									<Progress {...project.progress} />
								</div>
								<button
									className="flex h-5 items-center gap-2 rounded-xs bg-secondary px-1"
									type="button"
								>
									<LayersIcon className="size-3" />
									<span>
										{Number(project.progress.completed) +
											Number(project.progress.inProgress)}
									</span>
								</button>
							</div>
						</li>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem
							variant="destructive"
							disabled={isDeleting}
							onClick={() => {
								deleteProject({ id: project.id });
							}}
						>
							Delete
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			))}
		</ul>
	);
};

export const Progress = ({
	completed,
	inProgress,
}: {
	completed: number;
	inProgress: number;
}) => {
	const total = completed + inProgress;
	const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

	return (
		<Tooltip>
			<TooltipTrigger className="w-full">
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
					<div
						className="h-full bg-primary transition-all duration-500"
						style={{ width: `${percentage}%` }}
					/>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				{completed} tasks completed ({percentage}%)
			</TooltipContent>
		</Tooltip>
	);
};
