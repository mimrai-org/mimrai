"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@mimir/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useLabelParams } from "@/hooks/use-task-label-params";
import { trpc } from "@/utils/trpc";
import { LabelForm } from "../forms/label-form";

export const LabelUpdateSheet = () => {
	const { labelId, setParams } = useLabelParams();

	const isOpen = Boolean(labelId);

	const { data: label } = useQuery(
		trpc.labels.getById.queryOptions(
			{ id: labelId! },
			{
				enabled: isOpen,
			},
		),
	);

	return (
		<Sheet open={isOpen} onOpenChange={() => setParams(null)}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Update Label</SheetTitle>
				</SheetHeader>
				{label && (
					<LabelForm
						defaultValues={{
							id: label.id,
							name: label.name,
							color: label.color,
							description: label.description || "",
						}}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
};
