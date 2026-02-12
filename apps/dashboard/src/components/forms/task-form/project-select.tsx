import { DataSelectInput } from "@mimir/ui/data-select-input";
import { FormControl, FormField, FormItem } from "@mimir/ui/form";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ProjectIcon } from "@/components/project-icon";
import { useProjects } from "@/hooks/use-data";
import { trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form-type";

export const ProjectSelect = () => {
	const form = useFormContext<TaskFormValues>();
	const projectId = form.watch("projectId");

	const { data: projects } = useProjects();

	useEffect(() => {
		if (
			projects?.data &&
			projects?.data.length === 1 &&
			!projectId &&
			!form.formState.dirtyFields.projectId
		) {
			form.setValue("projectId", projects?.data[0]?.id);
		}
	}, [projects, projectId]);

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
							onChange={(value) => field.onChange(value || null)}
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
