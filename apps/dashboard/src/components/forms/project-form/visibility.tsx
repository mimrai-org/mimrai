import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { FormLabel } from "@ui/components/ui/form";
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

export const ProjectVisibilitySelect = ({
	variant,
}: {
	variant?: "compact" | "expanded";
}) => {
	const form = useFormContext<ProjectFormValues>();

	const visibility = form.watch("visibility");
	const label = useMemo(() => {
		const option = options.find((opt) => opt.value === visibility);
		return option ? option.label : null;
	}, [visibility]);

	return (
		<div className="space-y-1">
			{variant !== "compact" && <FormLabel>Visibility</FormLabel>}
			<DropdownMenu>
				<DropdownMenuTrigger className="flex h-6 items-center gap-2 text-sm">
					<EyeIcon className="size-3.5 text-muted-foreground" />
					{visibility ? (
						<span>{label}</span>
					) : (
						<span className="text-muted-foreground">Visibility</span>
					)}
				</DropdownMenuTrigger>
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
		</div>
	);
};
