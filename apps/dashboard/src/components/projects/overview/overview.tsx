"use client";
import { useQuery } from "@tanstack/react-query";
import { FolderIcon } from "lucide-react";
import { useSetBreadcrumbs } from "@/components/breadcrumbs";
import { ProjectForm } from "@/components/forms/project-form/form";
import { trpc } from "@/utils/trpc";
import { MilestonesCard } from "./milestones-card";

export const ProjectOverview = ({ projectId }: { projectId: string }) => {
	const { data } = useQuery(
		trpc.projects.getById.queryOptions({
			id: projectId,
		}),
	);

	useSetBreadcrumbs([
		{ label: data?.name, segments: ["projects", projectId], icon: FolderIcon },
	]);

	return (
		<div className="h-full overflow-y-auto rounded-md bg-card p-6">
			{data && (
				<div className="space-y-6">
					<ProjectForm
						defaultValues={{
							...data,
						}}
					/>
					<hr />
					<MilestonesCard projectId={projectId} />
				</div>
			)}
		</div>
	);
};
