"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Skeleton } from "@ui/components/ui/skeleton";
import { CalendarIcon } from "lucide-react";
import {
	EmptyState,
	EmptyStateAction,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
} from "@/components/empty-state";
import { ProjectsTimeline } from "@/components/projects-timeline/projects-timeline";
import { useProjectParams } from "@/hooks/use-project-params";
import { trpc } from "@/utils/trpc";

export default function Page() {
	const { setParams } = useProjectParams();
	const queryClient = useQueryClient();
	const { data: projects, isLoading } = useQuery(
		trpc.projects.getForTimeline.queryOptions(),
	);

	const { mutate: updateProject } = useMutation(
		trpc.projects.update.mutationOptions(),
	);

	const handleProjectDateChange = (
		projectId: string,
		startDate: Date | null,
		endDate: Date | null,
	) => {
		updateProject({
			id: projectId,
			...(startDate && { startDate: startDate.toISOString() }),
			...(endDate && { endDate: endDate.toISOString() }),
		});

		queryClient.setQueryData(
			trpc.projects.getForTimeline.queryKey(),
			(oldProjects) => {
				if (!oldProjects) return oldProjects;
				return oldProjects.map((project) => {
					if (project.id === projectId) {
						return {
							...project,
							startDate: startDate
								? startDate.toISOString()
								: project.startDate,
							endDate: endDate ? endDate.toISOString() : project.endDate,
						};
					}
					return project;
				});
			},
		);
	};

	const handleProjectClick = (projectId: string) => {
		const project = projects?.find((p) => p.id === projectId);
		if (!project) return;

		queryClient.setQueryData(
			trpc.projects.getById.queryKey({ id: projectId }),
			project,
		);
		setParams({ projectId });
	};

	if (isLoading) {
		return (
			<div className="space-y-4 px-4 pt-16">
				{[...Array(5)].map((_, i) => (
					<Skeleton key={i} className="h-8 w-full rounded-sm" />
				))}
			</div>
		);
	}

	// Filter projects that have at least a startDate, endDate, or milestones with dueDates
	const projectsWithDates = (projects || []).filter(
		(project) =>
			project.startDate ||
			project.endDate ||
			project.milestones.some((m) => m.dueDate),
	);

	if (projectsWithDates.length === 0) {
		return (
			<EmptyState>
				<EmptyStateIcon>
					<CalendarIcon className="size-10" />
				</EmptyStateIcon>
				<EmptyStateTitle>No timeline data</EmptyStateTitle>
				<EmptyStateDescription>
					Projects need start and end dates or milestones with due dates to
					appear on the timeline.
				</EmptyStateDescription>
				<EmptyStateAction>
					<Button
						onClick={() => setParams({ createProject: true })}
						variant="default"
					>
						Create a project
					</Button>
				</EmptyStateAction>
			</EmptyState>
		);
	}

	return (
		<ProjectsTimeline
			projects={projectsWithDates}
			allProjects={projects || []}
			onProjectDateChange={handleProjectDateChange}
			onProjectClick={handleProjectClick}
		/>
	);
}
