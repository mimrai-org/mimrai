"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
	CircularProgress,
	CircularProgressIndicator,
	CircularProgressRange,
	CircularProgressTrack,
} from "@ui/components/ui/circular-progress";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import Link from "next/link";
import { useMemo } from "react";
import { ProjectIcon } from "@/components/project-icon";
import { useUser } from "@/components/user-provider";
import { useProjectParams } from "@/hooks/use-project-params";
import { trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import {
	NavItem,
	NavItemContent,
	NavItemIcon,
	NavItemIconSecondary,
	NavItemSubtitle,
	NavItemTitle,
} from "../nav/nav-item";
import { ProjectContextMenu } from "./context-menu";
import { ProjectsFilters } from "./filters";
import { useProjectsFilterParams } from "./use-projects-filter-params";

export type Project = RouterOutputs["projects"]["get"]["data"][number];

export const ProjectsList = ({
	showFilters = true,
	pageSize = 8,
}: {
	pageSize?: number;
	showFilters?: boolean;
}) => {
	const user = useUser();
	const { setParams } = useProjectParams();
	const { params } = useProjectsFilterParams();

	const { data } = useInfiniteQuery(
		trpc.projects.get.infiniteQueryOptions(
			{
				pageSize,
				search: params.search ?? "",
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const listData = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) || [];
	}, [data]);

	return (
		<div className="w-full">
			{showFilters && <ProjectsFilters />}

			<div className="grid grid-cols-4 gap-4">
				{listData.map((project) => {
					const total =
						project.progress.inProgress + project.progress.completed;
					const progress =
						total > 0
							? Math.round((project.progress.completed / total) * 100)
							: 0;
					return (
						<ProjectContextMenu key={project.id} project={project}>
							<Link
								href={`${user?.basePath}/projects/${project.id}`}
								className="w-full"
							>
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
												<AssigneeAvatar {...project.lead} className="size-4" />
												<div className="flex items-center gap-1 rounded-sm px-1">
													<span>{Number(project.progress.inProgress)}</span>
													Pending
												</div>
											</div>
										</NavItemSubtitle>
									</NavItemContent>
								</NavItem>
							</Link>
						</ProjectContextMenu>
					);
				})}

				<NavItem
					className="border border-dashed text-muted-foreground"
					onClick={() => {
						setParams({ createProject: true });
					}}
				>
					<NavItemContent>
						<NavItemTitle>Create Project</NavItemTitle>
						<NavItemSubtitle>
							Organize your work on a new project
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
