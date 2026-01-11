import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { EyeIcon } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { ProjectFormValues } from "./form-type";

const options = [
	{ value: "team" as const, label: "Team" },
	{ value: "private" as const, label: "Private" },
];

export const ProjectVisibilitySelect = () => {
	const form = useFormContext<ProjectFormValues>();

	const visibility = form.watch("visibility");
	const label = useMemo(() => {
		const option = options.find((opt) => opt.value === visibility);
		return option ? option.label : null;
	}, [visibility]);

	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger className="flex h-6 items-center gap-2 rounded-sm border px-2 text-xs">
						<EyeIcon className="size-3.5 text-muted-foreground" />
						{visibility ? (
							<span>{label}</span>
						) : (
							<span className="text-muted-foreground">Visibility</span>
						)}
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>
					Visibility determines who can see this project.
				</TooltipContent>
			</Tooltip>
			<DropdownMenuContent>
				{options?.map((option) => (
					<DropdownMenuItem
						key={option.value}
						className="flex items-center gap-2"
						onSelect={() => {
							form.setValue("visibility", option.value);
						}}
					>
						<span className="flex-1">{option.label}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
