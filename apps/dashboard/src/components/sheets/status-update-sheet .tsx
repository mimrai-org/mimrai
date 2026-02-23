"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useStatusParams } from "@/hooks/use-status-params";
import { trpc } from "@/utils/trpc";
import { StatusForm } from "../forms/status-form";

export const StatusUpdateSheet = () => {
	const { statusId, setParams } = useStatusParams();

	const isOpen = Boolean(statusId);

	const { data: status } = useQuery(
		trpc.statuses.getById.queryOptions(
			{ id: statusId! },
			{
				enabled: isOpen,
			},
		),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Status</DialogTitle>
				</DialogHeader>

				<StatusForm
					defaultValues={{
						id: status?.id,
						name: status?.name || "",
						description: status?.description || "",
						type: status?.type || "in_progress",
						projectIds:
							((status as any)?.projectIds as string[] | undefined) || [],
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};
