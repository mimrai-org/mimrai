import { Button } from "@mimir/ui/button";
import { Checkbox } from "@mimir/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@mimir/ui/command";
import { LabelBadge } from "@mimir/ui/label-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@mimir/ui/popover";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

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
	const [search, setSearch] = useState("");
	const { data: labels } = useQuery(trpc.labels.get.queryOptions({}));

	const { mutate: createLabel, isPending } = useMutation(
		trpc.labels.create.mutationOptions({
			onMutate: () => {
				toast.loading("Creating label...", {
					id: "create-label",
				});
			},
			onSuccess: (data) => {
				toast.success("Label created", {
					id: "create-label",
				});
				queryClient.setQueryData(trpc.labels.get.queryKey({}), (oldData) => {
					if (!oldData) return oldData;
					return [
						...oldData,
						{
							...data,
							taskCount: 0,
						},
					];
				});
				setSearch("");
				onChange([...value, data.id]);
			},
			onError: (error) => {
				toast.error(`Error creating label: ${error.message}`, {
					id: "create-label",
				});
			},
		}),
	);

	const selectedLabels =
		labels?.filter((label) => value.includes(label.id)) ?? [];

	const createLabelFromSearch = () => {
		if (isPending) return;
		if (search.trim()) {
			createLabel({
				name: search.trim(),
			});
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		const hasMatches = labels?.some(
			(label) => label.name.toLowerCase() === search.trim().toLowerCase(),
		);
		if (e.key === "Enter" && search.trim() && !hasMatches) {
			createLabelFromSearch();
		}
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant={"ghost"}
					className={cn(
						className,
						"group h-5.5 hover:bg-transparent dark:hover:bg-transparent",
					)}
				>
					{selectedLabels.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{selectedLabels.map((label) => (
								<LabelBadge key={label.id} {...label} />
							))}
						</div>
					)}
					<span className="font-normal text-muted-foreground transition-colors group-hover:text-foreground">
						{placeholder}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Command>
					<CommandInput
						placeholder="Search labels..."
						value={search}
						onValueChange={setSearch}
						onKeyDown={handleKeyDown}
					/>
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
									<LabelBadge {...label} className="bg-transparent" />
								</CommandItem>
							);
						})}
					</CommandGroup>
					<CommandEmpty className="px-0 pt-1">
						<Button
							className="w-full justify-start font-normal text-sm"
							type="button"
							variant={"ghost"}
							disabled={isPending}
							size={"sm"}
							onClick={() => {
								createLabelFromSearch();
							}}
						>
							<PlusIcon />
							Create label "{search}"
						</Button>
					</CommandEmpty>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
