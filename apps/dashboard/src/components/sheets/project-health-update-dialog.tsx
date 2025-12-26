"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useProjectHealthUpdateParams } from "@/hooks/use-project-health-update-params";
import { trpc } from "@/utils/trpc";
import { ProjectHealthUpdateForm } from "../forms/project-health-update-form/form";

export const ProjectHealthUpdateDialog = () => {
	const { healthUpdateId, setParams } = useProjectHealthUpdateParams();

	const isOpen = Boolean(healthUpdateId);

	const { data: healthUpdate } = useQuery(
		trpc.projectHealthUpdates.getById.queryOptions(
			{ id: healthUpdateId! },
			{
				enabled: isOpen,
				placeholderData: (data) => data,
			},
		),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle />
				</DialogHeader>
				{healthUpdate && (
					<ProjectHealthUpdateForm
						projectId={healthUpdate.projectId}
						defaultValues={{
							id: healthUpdate.id,
							health: healthUpdate.health,
							summary: healthUpdate.summary || "",
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
