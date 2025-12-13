"use client";
import { useQuery } from "@tanstack/react-query";
import { ProjectForm } from "@/components/forms/project-form/form";
import { trpc } from "@/utils/trpc";
import { MilestonesCard } from "./milestones-card";
import { ProjectProgressCard } from "./progress-card";

export const ProjectDetail = ({ projectId }: { projectId: string }) => {
	const { data } = useQuery(
		trpc.projects.getById.queryOptions({
			id: projectId,
		}),
	);

	return (
		<div className="mx-auto max-w-6xl px-6 py-6">
			{data && (
				<div className="space-y-6">
					<ProjectForm
						defaultValues={{
							...data,
						}}
					/>
					<div className="grid gap-6 md:grid-cols-2">
						<MilestonesCard projectId={projectId} />
						<ProjectProgressCard projectId={projectId} />
					</div>
				</div>
			)}
		</div>
	);
};
