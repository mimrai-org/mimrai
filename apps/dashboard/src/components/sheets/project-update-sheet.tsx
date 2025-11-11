"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { Skeleton } from "@mimir/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useProjectParams } from "@/hooks/use-project-params";
import { trpc } from "@/utils/trpc";
import { ProjectForm } from "../forms/project-form/form";

export const ProjectUpdateSheet = () => {
	const { projectId, setParams } = useProjectParams();

	const isOpen = Boolean(projectId);

	const { data: project } = useQuery(
		trpc.projects.getById.queryOptions(
			{
				id: projectId!,
			},
			{
				enabled: isOpen,
				placeholderData: (old) => {
					if (!projectId) return old;
					if (projectId === old?.id) return old;
					return undefined;
				},
			},
		),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams({ projectId: null })}>
			<DialogHeader>
				<DialogTitle />
			</DialogHeader>
			<DialogContent
				showCloseButton={true}
				className="max-h-[85vh] overflow-y-auto pt-0 sm:min-w-[60vw]"
			>
				{project ? (
					<ProjectForm
						defaultValues={{
							...project,
						}}
					/>
				) : (
					<Skeleton className="h-[200px] w-full" />
				)}
			</DialogContent>
		</Dialog>
	);
};
