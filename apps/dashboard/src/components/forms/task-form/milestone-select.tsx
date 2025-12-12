import { DataSelectInput } from "@mimir/ui/data-select-input";
import { FormControl, FormField, FormItem } from "@mimir/ui/form";
import { useFormContext } from "react-hook-form";
import { MilestoneIcon } from "@/components/milestone-icon";
import { trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form-type";

export const MilestoneSelect = () => {
	const form = useFormContext<TaskFormValues>();

	const projectId = form.watch("projectId");

	if (!projectId) {
		return null;
	}

	return (
		<FormField
			name="milestoneId"
			control={form.control}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<DataSelectInput
							size="sm"
							clearable
							renderClear={() => "No milestone"}
							className="h-6! text-xs"
							queryOptions={trpc.milestones.get.queryOptions(
								{
									projectId: projectId,
								},
								{
									select: (data) => data.data,
								},
							)}
							value={field.value || null}
							onChange={(value) => field.onChange(value || null)}
							getLabel={(item) => item?.name ?? ""}
							getValue={(item) => item?.id ?? ""}
							placeholder="No milestone"
							renderValue={(item) => (
								<span className="flex items-center gap-2">
									<MilestoneIcon className="size-3.5" {...item} />
									{item.name}
								</span>
							)}
							renderItem={(item) => (
								<span className="flex items-center gap-2">
									<MilestoneIcon className="size-3.5" {...item} />
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
