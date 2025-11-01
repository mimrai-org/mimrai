import { DataSelectInput } from "@mimir/ui/data-select-input";
import { FormControl, FormField, FormItem, FormLabel } from "@mimir/ui/form";
import { useFormContext } from "react-hook-form";
import { ColumnIcon } from "@/components/column-icon";
import { trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form";

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
							className="h-6! w-full text-xs"
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
							renderValue={(item) => (
								<span className="flex items-center gap-2">
									<ColumnIcon className="size-3.5" type={item.type} />
									{item.name}
								</span>
							)}
							renderItem={(item) => (
								<span className="flex items-center gap-2">
									<ColumnIcon type={item.type} />
									{item.name}
								</span>
							)}
							variant={"secondary"}
						/>
					</FormControl>
				</FormItem>
			)}
		/>
	);
};
