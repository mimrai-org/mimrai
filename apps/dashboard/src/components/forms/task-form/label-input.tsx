import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { LabelBadge } from "@/components/ui/label-badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
				<Button type="button" variant={"ghost"} className={className}>
					{selectedLabels.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{selectedLabels.map((label) => (
								<LabelBadge key={label.id} {...label} />
							))}
						</div>
					)}
					<span className="text-muted-foreground">{placeholder}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Command>
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
