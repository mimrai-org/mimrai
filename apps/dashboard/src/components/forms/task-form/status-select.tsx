import type { RouterOutputs } from "@mimir/trpc";
import { DataSelectInput } from "@mimir/ui/data-select-input";
import { FormControl, FormField, FormItem } from "@mimir/ui/form";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { StatusIcon } from "@/components/status-icon";
import { trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form-type";

type StatusOption = RouterOutputs["statuses"]["get"]["data"][number];

export const StatusSelect = () => {
	const form = useFormContext<TaskFormValues>();
	const projectId = useWatch({
		control: form.control,
		name: "projectId",
	});
	const statusId = useWatch({
		control: form.control,
		name: "statusId",
	});
	const normalizedProjectId = projectId || null;

	const { data: availableStatuses } = useQuery<StatusOption[]>(
		trpc.statuses.get.queryOptions(
			{
				projectId: normalizedProjectId,
			} as any,
			{
				select: (data) => data.data as StatusOption[],
			},
		) as any,
	);

	useEffect(() => {
		if (!statusId || !availableStatuses) return;

		const isStillValid = availableStatuses.some(
			(status) => status.id === statusId,
		);
		if (!isStillValid) {
			form.setValue("statusId", "" as TaskFormValues["statusId"], {
				shouldDirty: true,
				shouldValidate: true,
			});
		}
	}, [availableStatuses, form, statusId]);

	return (
		<FormField
			name="statusId"
			control={form.control}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<DataSelectInput
							size="sm"
							className="h-6! text-xs"
							queryOptions={trpc.statuses.get.queryOptions(
								{
									projectId: normalizedProjectId,
								} as any,
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
									<StatusIcon className="size-3.5" type={item.type} />
									{item.name}
								</span>
							)}
							renderItem={(item) => (
								<span className="flex items-center gap-2">
									<StatusIcon type={item.type} />
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
