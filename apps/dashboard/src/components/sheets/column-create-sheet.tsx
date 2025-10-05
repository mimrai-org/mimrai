"use client";
import { useColumnParams } from "@/hooks/use-column-params";
import { ColumnForm } from "../forms/column-form";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../ui/sheet";

export const ColumnCreateSheet = () => {
	const { createColumn, setParams } = useColumnParams();

	const isOpen = Boolean(createColumn);

	return (
		<Sheet open={isOpen} onOpenChange={() => setParams(null)}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Create Column</SheetTitle>
					<SheetDescription>
						Create a new column for your project.
					</SheetDescription>
				</SheetHeader>

				<ColumnForm defaultValues={{}} />
			</SheetContent>
		</Sheet>
	);
};
