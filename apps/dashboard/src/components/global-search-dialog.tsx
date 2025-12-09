"use client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader } from "@ui/components/ui/dialog";
import { Input } from "@ui/components/ui/input";
import {
	BoxIcon,
	ChevronRight,
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="p-4" showCloseButton={false}>
				<DialogHeader className="hidden">
					<DialogTitle />
				</DialogHeader>
				<div className="relative">
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-11 ps-11"
						placeholder="Search..."
					/>
					<div className="-translate-y-1/2 absolute top-1/2 left-4">
						<SearchIcon className="size-4 text-muted-foreground" />
					</div>
				</div>
				<div>
					<AnimatePresence mode="popLayout">
						{groupedData &&
							Object.entries(groupedData).map(([type, items]) => {
								return (
									<motion.div key={type} className="mt-4">
										<motion.h3
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.2 }}
											className="mb-2 px-4 font-medium text-muted-foreground text-xs capitalize"
										>
											{type}
										</motion.h3>
										{items?.map((item) => {
											const Icon = searchIcons[item.type];
											return (
												<motion.button
													type="button"
													key={item.id}
													className="flex w-full cursor-pointer items-center rounded-sm px-4 py-3 text-sm transition-colors hover:bg-muted"
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
													onClick={() => {
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
												</motion.button>
											);
										})}
									</motion.div>
								);
							})}
					</AnimatePresence>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const searchIcons = {
	task: LayersIcon,
	project: BoxIcon,
	milestone: TargetIcon,
};
