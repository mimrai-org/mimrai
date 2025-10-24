import { useFormContext } from "react-hook-form";
import { DataSelectInput } from "@/components/ui/data-select-input";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./task-form";

export const ColumnSelect = () => {
	const form = useFormContext<TaskFormValues>();

	return (
		<FormField
			name="columnId"
			control={form.control}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<DataSelectInput
							size="sm"
							className="w-full"
							// @ts-expect-error
							queryOptions={trpc.columns.get.queryOptions(
								{},
								{
									select: (data) => data.data,
								},
							)}
							value={field.value || null}
							onChange={(value) => field.onChange(value || undefined)}
							getLabel={(item) => item?.name ?? ""}
							getValue={(item) => item?.id ?? ""}
							variant={"ghost"}
						/>
					</FormControl>
				</FormItem>
			)}
		/>
	);
};
