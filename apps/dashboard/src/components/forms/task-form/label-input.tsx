import { Button } from "@mimir/ui/button";
import { Checkbox } from "@mimir/ui/checkbox";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@mimir/ui/command";
import { LabelBadge } from "@mimir/ui/label-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@mimir/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export const LabelInput = ({
	value,
	onChange,
	placeholder,
	className,
}: {
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	className?: string;
}) => {
	const { data: labels } = useQuery(trpc.labels.get.queryOptions({}));

	const selectedLabels =
		labels?.filter((label) => value.includes(label.id)) ?? [];

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button type="button" variant={"ghost"} className={cn(className, "")}>
					{selectedLabels.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{selectedLabels.map((label) => (
								<LabelBadge key={label.id} {...label} />
							))}
						</div>
					)}
					<span className="font-normal text-muted-foreground">
						{placeholder}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Command>
					<CommandInput placeholder="Search labels..." />
					<CommandGroup>
						{labels?.map((label) => {
							const isSelected = value.includes(label.id);

							return (
								<CommandItem
									key={label.id}
									onSelect={() => {
										if (isSelected) {
											onChange(value.filter((v) => v !== label.id));
										} else {
											onChange([...value, label.id]);
										}
									}}
								>
									<Checkbox checked={isSelected} />
									<LabelBadge {...label} />
								</CommandItem>
							);
						})}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
