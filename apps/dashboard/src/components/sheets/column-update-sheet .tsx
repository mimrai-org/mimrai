"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@mimir/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useColumnParams } from "@/hooks/use-column-params";
import { trpc } from "@/utils/trpc";
import { ColumnForm } from "../forms/column-form";

export const ColumnUpdateSheet = () => {
	const { columnId, setParams } = useColumnParams();

	const isOpen = Boolean(columnId);

	const { data: column } = useQuery(
		trpc.columns.getById.queryOptions(
			{ id: columnId! },
			{
				enabled: isOpen,
			},
		),
	);

	return (
		<Sheet open={isOpen} onOpenChange={() => setParams(null)}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Update Column</SheetTitle>
				</SheetHeader>

				<ColumnForm
					defaultValues={{
						id: column?.id,
						name: column?.name || "",
						description: column?.description || "",
						type: column?.type || "normal",
					}}
				/>
			</SheetContent>
		</Sheet>
	);
};
