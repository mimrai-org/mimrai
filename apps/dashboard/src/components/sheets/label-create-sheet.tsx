"use client";
import { useLabelParams } from "@/hooks/use-task-label-params";
import { LabelForm } from "../forms/label-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

export const LabelCreateSheet = () => {
	const { createLabel, setParams } = useLabelParams();

	const isOpen = Boolean(createLabel);

	return (
		<Sheet open={isOpen} onOpenChange={() => setParams(null)}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Create Label</SheetTitle>
				</SheetHeader>
				<LabelForm />
			</SheetContent>
		</Sheet>
	);
};
