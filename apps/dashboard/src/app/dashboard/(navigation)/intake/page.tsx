"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import IntakeActionForm, {
	type TaskFormValues,
} from "@/components/intake-action-form";
import IntakeInboxList from "@/components/intake-inbox-list";
import IntakeItemDetail from "@/components/intake-item-detail";
import { trpc } from "@/utils/trpc";

export default function IntakePage() {
	const queryClient = useQueryClient();
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

	const { data: intakeItems } = useQuery(
		trpc.intake.getPending.queryOptions({
			limit: 50,
		}),
	);

	const { data: columnsData } = useQuery(
		trpc.columns.get.queryOptions({
			type: ["to_do", "in_progress", "backlog"],
		}),
	);

	const { data: membersData } = useQuery(trpc.teams.getMembers.queryOptions());

	const columns = columnsData?.data;
	const members = membersData;

	const selectedItem = intakeItems?.find((item) => item.id === selectedItemId);

	const { mutateAsync: createTask, isPending: isCreating } = useMutation(
		trpc.intake.acceptAndCreateTask.mutationOptions({
			onSuccess: () => {
				toast.success("Task created successfully!");
				queryClient.invalidateQueries({
					queryKey: [["intake", "getPending"]],
				});
				// Move to next item
				const index =
					intakeItems?.findIndex((i) => i.id === selectedItemId) ?? -1;
				if (index !== -1 && intakeItems && index < intakeItems.length - 1) {
					setSelectedItemId(intakeItems[index + 1]!.id);
				} else {
					setSelectedItemId(null);
				}
			},
			onError: (error) => {
				toast.error(error.message || "Failed to create task");
			},
		}),
	);

	const { mutateAsync: rejectItem, isPending: isRejecting } = useMutation(
		trpc.intake.updateStatus.mutationOptions({
			onSuccess: () => {
				toast.success("Item rejected");
				queryClient.invalidateQueries({
					queryKey: [["intake", "getPending"]],
				});
				// Move to next item
				const index =
					intakeItems?.findIndex((i) => i.id === selectedItemId) ?? -1;
				if (index !== -1 && intakeItems && index < intakeItems.length - 1) {
					setSelectedItemId(intakeItems[index + 1]!.id);
				} else {
					setSelectedItemId(null);
				}
			},
			onError: (error) => {
				toast.error(error.message || "Failed to reject item");
			},
		}),
	);

	const handleCreateTask = async (values: TaskFormValues) => {
		if (!selectedItemId) return;
		await createTask({
			id: selectedItemId,
			...values,
		});
	};

	const handleReject = async () => {
		if (!selectedItemId) return;
		await rejectItem({ id: selectedItemId, status: "rejected" });
	};

	return (
		<div className="flex h-screen overflow-hidden">
			<IntakeInboxList
				intakeItems={intakeItems}
				selectedId={selectedItemId}
				onSelect={setSelectedItemId}
			/>

			{/* Right: Context (Top) + Actions (Bottom) */}
			<div className="flex h-full flex-1 flex-col">
				{/* Top Section: Email Context */}
				<div className="flex-[3] overflow-hidden">
					<IntakeItemDetail selectedItem={selectedItem} />
				</div>

				{/* Bottom Section: Action Form */}
				<div className="flex-[2] overflow-hidden">
					<IntakeActionForm
						selectedItem={selectedItem}
						columns={columns}
						members={members}
						onSubmit={handleCreateTask}
						onReject={handleReject}
						isCreating={isCreating}
						isRejecting={isRejecting}
					/>
				</div>
			</div>
		</div>
	);
}
