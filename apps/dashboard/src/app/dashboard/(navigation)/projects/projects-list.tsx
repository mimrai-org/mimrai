"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
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
import { format } from "date-fns";
import { BoxIcon, LayersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import {
	EmptyState,
	EmptyStateAction,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
} from "@/components/empty-state";
import { MilestoneIcon } from "@/components/milestone-icon";
import { ProjectIcon } from "@/components/project-icon";
import { useProjectParams } from "@/hooks/use-project-params";
import { queryClient, trpc } from "@/utils/trpc";

export const ProjectsList = () => {
	const router = useRouter();
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
		<div className="w-full">
			{listData.map((project) => (
				<ContextMenu key={project.id}>
					<ContextMenuTrigger asChild>
						<button
							className="flex w-full flex-wrap justify-between px-4 py-4 text-sm transition-colors last:border-0 hover:bg-card/80"
							type="button"
							onClick={() => {
								queryClient.setQueryData(
									trpc.projects.getById.queryKey({ id: project.id }),
									project,
								);
								router.push(`/dashboard/projects/${project.id}/detail`);
							}}
						>
							<div className="flex items-center gap-2">
								<ProjectIcon className="size-4" color={project.color} />
								<h3 className="font-medium">{project.name}</h3>
								{project.milestone?.name && (
									<div
										role="button"
										tabIndex={0}
										onClick={(e) => {
											e.stopPropagation();
											router.push(
												`/dashboard/projects/${project.id}/tasks?mId=${project.milestone?.id}`,
											);
										}}
										className="ml-2 flex items-center gap-1 text-xs opacity-70 transition-opacity hover:opacity-100"
									>
										<MilestoneIcon {...project.milestone} className="size-4" />
										<span>{project.milestone.name}</span>
										{project.milestone.dueDate && (
											<span>
												{format(new Date(project.milestone.dueDate), "MMM dd")}
											</span>
										)}
									</div>
								)}
							</div>
							<div className="flex items-center gap-4">
								<div className="w-24 sm:w-48">
									<Progress {...project.progress} />
								</div>
								<div className="flex h-5 items-center gap-2 rounded-sm bg-secondary px-2">
									<LayersIcon className="size-3" />
									<span>
										{Number(project.progress.completed) +
											Number(project.progress.inProgress)}
									</span>
								</div>
							</div>
						</button>
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
		</div>
	);
};

export const Progress = ({
	completed,
	inProgress,
	color,
}: {
	completed: number;
	inProgress: number;
	color?: string | null;
}) => {
	const total = completed + inProgress;
	const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

	return (
		<Tooltip>
			<TooltipTrigger className="w-full" asChild>
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-input">
					<div
						className="h-full transition-all duration-500"
						style={{
							width: `${percentage}%`,
							backgroundColor: color ?? "var(--primary)",
						}}
					/>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				{completed} tasks completed ({percentage}%)
			</TooltipContent>
		</Tooltip>
	);
};
