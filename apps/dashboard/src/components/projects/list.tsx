"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
	CircularProgress,
	CircularProgressIndicator,
	CircularProgressRange,
	CircularProgressTrack,
} from "@ui/components/ui/circular-progress";
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
import { CopyPlusIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { ProjectIcon } from "@/components/project-icon";
import { useUser } from "@/components/user-provider";
import { useProjectParams } from "@/hooks/use-project-params";
import { queryClient, trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import {
	NavItem,
	NavItemContent,
	NavItemIcon,
	NavItemIconSecondary,
	NavItemSubtitle,
	NavItemTitle,
} from "../nav/nav-item";
import { ProjectsFilters } from "./filters";
import { useProjectsFilterParams } from "./use-projects-filter-params";

export const ProjectsList = ({
	showFilters = true,
}: {
	showFilters?: boolean;
}) => {
	const router = useRouter();
	const user = useUser();
	const { setParams } = useProjectParams();
	const { params } = useProjectsFilterParams();

	const { data, isLoading } = useInfiniteQuery(
		trpc.projects.get.infiniteQueryOptions(
			{
				pageSize: 20,
				search: params.search ?? "",
			},
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

	const { mutate: cloneProject } = useMutation(
		trpc.projects.clone.mutationOptions({
			onMutate: () => {
				toast.loading("Cloning project...", { id: "clone-project" });
			},
			onSuccess: (project) => {
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				toast.success("Project cloned successfully", { id: "clone-project" });
				setParams({ projectId: project.id });
			},
			onError: (error) => {
				toast.error("Failed to clone project", { id: "clone-project" });
			},
		}),
	);

	const listData = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) || [];
	}, [data]);

	return (
		<div className="w-full">
			{showFilters && <ProjectsFilters />}

			<div className="flex flex-wrap gap-4">
				{listData.map((project) => {
					const total =
						project.progress.inProgress + project.progress.completed;
					const progress =
						total > 0
							? Math.round((project.progress.completed / total) * 100)
							: 0;
					return (
						<ContextMenu key={project.id}>
							<ContextMenuTrigger asChild>
								<Link href={`${user?.basePath}/projects/${project.id}`}>
									<NavItem>
										<NavItemIcon>
											<ProjectIcon hasTasks={total > 0} color={project.color} />
											<NavItemIconSecondary className="flex items-center justify-center">
												<CircularProgress
													size={12}
													thickness={2}
													value={progress ?? 0}
													min={0}
													max={100}
												>
													<CircularProgressIndicator>
														<CircularProgressTrack />
														<CircularProgressRange
															style={{
																color: project.color || undefined,
															}}
														/>
													</CircularProgressIndicator>
												</CircularProgress>
											</NavItemIconSecondary>
										</NavItemIcon>
										<NavItemContent>
											<NavItemTitle className="flex items-center gap-1">
												{project.name}
											</NavItemTitle>
											<NavItemSubtitle>
												<div className="flex items-center gap-1 text-xs">
													<AssigneeAvatar
														{...project.lead}
														className="size-4"
													/>
													<div className="flex items-center gap-1 rounded-sm px-1">
														<span>
															{Number(project.progress.completed) +
																Number(project.progress.inProgress)}
														</span>
														Tasks
													</div>
												</div>
											</NavItemSubtitle>
										</NavItemContent>
									</NavItem>
								</Link>
							</ContextMenuTrigger>
							<ContextMenuContent>
								<ContextMenuItem
									onClick={() => {
										cloneProject({ id: project.id });
									}}
								>
									<CopyPlusIcon />
									Clone
								</ContextMenuItem>
								<ContextMenuItem
									variant="destructive"
									disabled={isDeleting}
									onClick={() => {
										deleteProject({ id: project.id });
									}}
								>
									<TrashIcon />
									Delete
								</ContextMenuItem>
							</ContextMenuContent>
						</ContextMenu>
					);
				})}

				<NavItem
					className="border border-dashed text-muted-foreground"
					onClick={() => {
						setParams({ createProject: true });
					}}
				>
					{/* <NavItemIcon>
						<FolderIcon className="stroke-1 [stroke-dasharray:5]" />
						<NavItemIconSecondary>
							<PlusIcon />
						</NavItemIconSecondary>
					</NavItemIcon> */}
					<NavItemContent>
						<NavItemTitle>Create Project</NavItemTitle>
						<NavItemSubtitle>
							Start a new project to organize your work
						</NavItemSubtitle>
					</NavItemContent>
				</NavItem>
			</div>
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
