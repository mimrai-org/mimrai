import { DataSelectInput } from "@ui/components/ui/data-select-input";
import { FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { useFormContext } from "react-hook-form";
import {
	AssigneeAvatar,
	Assignee as AssigneeItem,
} from "@/components/asignee-avatar";
import { trpc } from "@/utils/trpc";

export const Assignee = () => {
	const form = useFormContext();

	return (
		<FormField
			control={form.control}
			name="assigneeId"
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<DataSelectInput
							queryOptions={(s) =>
								trpc.teams.getMembers.queryOptions({
									includeSystemUsers: true,
									search: s,
								})
							}
							value={field.value || null}
							onChange={(value) => field.onChange(value || null)}
							getValue={(item) => item.id}
							getLabel={(item) => item?.name || item?.email || "Unassigned"}
							variant={"secondary"}
							size={"sm"}
							className="h-6! w-fit px-2! py-1! text-xs"
							placeholder="Unassigned"
							clearable
							renderClear={() => (
								<div className="flex items-center gap-2">
									<AssigneeAvatar />
									Unassigned
								</div>
							)}
							renderItem={(item) => (
								<AssigneeItem {...item} className="size-6 text-sm" />
							)}
							renderValue={(item) => (
								<AssigneeItem {...item} className="size-5 text-sm" />
							)}
						/>
					</FormControl>
				</FormItem>
			)}
		/>
	);
};
