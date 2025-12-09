"use client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@ui/components/ui/dialog";
import { Input } from "@ui/components/ui/input";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	BoxIcon,
	ChevronRight,
	CornerDownLeftIcon,
	LayersIcon,
	SearchIcon,
	TargetIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { trpc } from "@/utils/trpc";

export const GlobalSearchDialog = ({
	open,
	onOpenChange,
	onSelect,
	defaultValues,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (item: {
		id: string;
		type: string;
		parentId?: string | null;
	}) => void;
	defaultValues?: {
		search?: string;
		type?: string[];
	};
}) => {
	const [search, setSearch] = useState(defaultValues?.search || "");
	const [debouncedSearch] = useDebounceValue(search, 300);

	const { data } = useQuery(
		trpc.globalSearch.search.queryOptions({
			search: debouncedSearch,
			type: defaultValues?.type,
		}),
	);

	const groupedData = useMemo(() => {
		return data?.reduce(
			(acc, item) => {
				if (!acc[item.type]) {
					acc[item.type] = [];
				}
				acc[item.type]!.push(item);
				return acc;
			},
			{} as Record<string, typeof data>,
		);
	}, [data]);

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setSearch("");
		}
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="p-4" showCloseButton={false}>
				<DialogHeader className="hidden">
					<DialogTitle />
				</DialogHeader>
				<Command shouldFilter={false}>
					<CommandInput
						value={search}
						onValueChange={setSearch}
						containerClassName="h-11"
						placeholder="Search..."
					/>
					<CommandList>
						<AnimatePresence mode="popLayout">
							{groupedData &&
								Object.entries(groupedData).map(([type, items]) => {
									return (
										<CommandGroup
											key={type}
											heading={type}
											className="capitalize"
										>
											{items?.map((item) => {
												const Icon = searchIcons[item.type];
												return (
													<motion.div
														key={item.id}
														variants={{
															initial: {
																opacity: 0,
																y: -10,
															},
															animate: {
																opacity: 1,
																y: 0,
															},
														}}
														initial={"initial"}
														animate={"animate"}
														whileHover={"hover"}
														transition={{ duration: 0.2 }}
													>
														<CommandItem
															className="flex w-full cursor-pointer items-center rounded-sm px-4 py-3 text-sm transition-colors"
															onSelect={() => {
																onSelect(item);
																onOpenChange(false);
															}}
														>
															<Icon
																className="mr-2 size-4 text-muted-foreground"
																style={{
																	color: item.color || "inherit",
																}}
															/>
															{item.title}
															<motion.div
																className="ml-auto inline"
																variants={{
																	initial: {
																		opacity: 0,
																	},
																	hover: {
																		opacity: 1,
																	},
																}}
															>
																<ChevronRight className="size-4 text-muted-foreground" />
															</motion.div>
														</CommandItem>
													</motion.div>
												);
											})}
										</CommandGroup>
									);
								})}
						</AnimatePresence>
					</CommandList>
				</Command>
				<DialogFooter className="flex justify-between px-2">
					<div />
					<div className="flex items-center gap-4 text-muted-foreground">
						<ArrowDownIcon className="size-4" />
						<ArrowUpIcon className="size-4" />
						<CornerDownLeftIcon className="size-4" />
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

const searchIcons = {
	task: LayersIcon,
	project: BoxIcon,
	milestone: TargetIcon,
};
