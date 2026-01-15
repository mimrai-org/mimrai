import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { FormField, FormLabel } from "@ui/components/ui/form";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { CircleDashedIcon, EyeIcon } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { ProjectStatusIcon } from "@/components/projects/status-icon";
import type { ProjectFormValues } from "./form-type";

const options = [
	{ value: "planning" as const, label: "Planning" },
	{ value: "in_progress" as const, label: "In Progress" },
	{ value: "completed" as const, label: "Completed" },
	{ value: "on_hold" as const, label: "On Hold" },
];

export const ProjectStatusSelect = ({
	variant,
}: {
	variant?: "compact" | "expanded";
}) => {
	const form = useFormContext<ProjectFormValues>();

	const status = form.watch("status");
	const label = useMemo(() => {
		const option = options.find((opt) => opt.value === status);
		return option ? option.label : null;
	}, [status]);

	return (
		<FormField
			control={form.control}
			name="status"
			render={({ field }) => (
				<div className="space-y-1">
					{variant !== "compact" && <FormLabel>Status</FormLabel>}
					<DropdownMenu>
						<DropdownMenuTrigger className="flex h-6 items-center gap-2 text-sm">
							<ProjectStatusIcon
								status={status}
								className="size-3.5 text-muted-foreground"
							/>
							{status ? (
								<span>{label}</span>
							) : (
								<span className="text-muted-foreground">Status</span>
							)}
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{options?.map((option) => (
								<DropdownMenuItem
									key={option.value}
									className="flex items-center gap-2"
									onSelect={() => {
										field.onChange(option.value);
										field.onBlur();
									}}
								>
									<ProjectStatusIcon
										status={option.value}
										className="size-3.5 text-muted-foreground"
									/>
									<span className="flex-1">{option.label}</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		/>
	);
};
