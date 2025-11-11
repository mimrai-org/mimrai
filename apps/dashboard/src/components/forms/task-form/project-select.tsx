import { DataSelectInput } from "@mimir/ui/data-select-input";
import { FormControl, FormField, FormItem } from "@mimir/ui/form";
import { BoxIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { ProjectIcon } from "@/components/project-icon";
import { trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form-type";

export const ProjectSelect = () => {
	const form = useFormContext<TaskFormValues>();

	return (
		<FormField
			name="projectId"
			control={form.control}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<DataSelectInput
							size="sm"
							className="h-6! text-xs"
							queryOptions={trpc.projects.get.queryOptions(
								{},
								{
									select: (data) => data.data,
								},
							)}
							value={field.value || null}
							onChange={(value) => field.onChange(value || undefined)}
							getLabel={(item) => item?.name ?? ""}
							getValue={(item) => item?.id ?? ""}
							placeholder="No project"
							renderValue={(item) => (
								<span className="flex items-center gap-2">
									<ProjectIcon className="size-3.5" {...item} />
									{item.name}
								</span>
							)}
							renderItem={(item) => (
								<span className="flex items-center gap-2">
									<ProjectIcon className="size-3.5" {...item} />
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
