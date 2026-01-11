"use client";
import { useQuery } from "@tanstack/react-query";
import { ProjectForm } from "@/components/forms/project-form/form";
import { trpc } from "@/utils/trpc";
import { LatestUpdate } from "./latest-update-card";
import { MilestonesCard } from "./milestones-card";
import { ProjectProgressCard } from "./progress-card";

export const ProjectOverview = ({ projectId }: { projectId: string }) => {
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
						<LatestUpdate projectId={projectId} className="col-span-2" />
					</div>
				</div>
			)}
		</div>
	);
};
