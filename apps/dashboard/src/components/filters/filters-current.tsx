"use client";
import { useQuery } from "@tanstack/react-query";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import type { FilterOption } from "./types";
import { useFilters } from "./use-filters";

export const FiltersCurrentList = () => {
	const { options } = useFilters();

	return (
		<AnimatePresence mode="popLayout">
			{Object.entries(options).map(([key, option]) => {
				return <TasksFiltersCurrentItem key={key} option={option} />;
			})}
		</AnimatePresence>
	);
};

const TasksFiltersCurrentItem = ({ option }: { option: FilterOption }) => {
	const { filters, setFilters } = useFilters();
	const filterValue = filters[option.filterKey as keyof typeof filters];
	const noValue =
		!filterValue || (Array.isArray(filterValue) && filterValue.length === 0);

	const { data } = useQuery(option.queryOptions);
	const safeData = data as {
		label: string;
		value: string;
		icon?: React.ReactNode;
	}[];

	const displayValue = useMemo(() => {
		if (Array.isArray(filterValue)) {
			return safeData?.filter((item) =>
				filterValue.includes(item.value as any),
			);
		}

		return safeData?.find((item) => item.value === filterValue);
	}, [filterValue, safeData]);

	const handleToggle = (value: string) => {
		if (option.multiple) {
			const filterValue = filters[
				option.filterKey as keyof typeof filters
			] as any[];
			if (filterValue.includes(value as any)) {
				setFilters({
					[option.filterKey]: filterValue.filter((v) => v !== value),
				});
			} else {
				setFilters({
					[option.filterKey]: [...filterValue, value],
				});
			}
		} else {
			const filterValue = filters[option.filterKey as keyof typeof filters];
			if (filterValue === value) {
				setFilters({
					[option.filterKey]: undefined,
				});
			} else {
				setFilters({
					[option.filterKey]: value,
				});
			}
		}
	};

	if (noValue) {
		return null;
	}

	return (
		<motion.div
			itemID="item"
			variants={{
				initial: { backgroundColor: "transparent", opacity: 0, y: 10 },
				animate: { opacity: 1, y: 0 },
				hover: { backgroundColor: "var(--muted)" },
			}}
			initial="initial"
			animate="animate"
			exit={{ opacity: 0, y: 10 }}
			whileHover={"hover"}
		>
			<DropdownMenu>
				<div className="flex h-8 gap-1 rounded-sm border px-2 text-xs">
					<DropdownMenuTrigger asChild>
						<button type="button" className="flex items-center gap-1">
							<div className="text-muted-foreground">{option.label}</div>
							{displayValue &&
							Array.isArray(displayValue) &&
							displayValue.length > 1
								? "any of"
								: " is"}
							<div className="flex items-center gap-2">
								{Array.isArray(displayValue) ? (
									displayValue.length > 1 ? (
										<div className="flex items-center gap-1">
											{displayValue.map((item) => {
												if (!item.icon) return null;
												return (
													<div
														key={item.value}
														className="-ml-3 first:ml-0 [&_svg]:fill-background"
													>
														{item.icon}
													</div>
												);
											})}
											<span>
												{displayValue.length} {option.label}s
											</span>
										</div>
									) : (
										displayValue.map((item) => (
											<div key={item.value} className="flex items-center gap-1">
												{item.icon}
												<span className="max-w-32 truncate">{item.label}</span>
											</div>
										))
									)
								) : null}
							</div>
						</button>
					</DropdownMenuTrigger>
					<motion.button
						className="text-destructive"
						variants={{
							hover: { width: "auto", opacity: 1 },
							initial: { width: 0, opacity: 0 },
						}}
						onClick={(e) => {
							e.stopPropagation();
							setFilters({ [option.filterKey]: null });
						}}
					>
						<XIcon className="size-4" />
					</motion.button>
				</div>
				<DropdownMenuContent>
					{safeData?.map((item) => (
						<DropdownMenuCheckboxItem
							checked={
								Array.isArray(filterValue)
									? filterValue.includes(item.value as any)
									: filterValue === item.value
							}
							onCheckedChange={() => handleToggle(item.value as string)}
							key={item.value}
						>
							{item.icon}
							{item.label}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</motion.div>
	);
};
