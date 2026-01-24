"use client";
import { useQuery } from "@tanstack/react-query";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { format } from "date-fns";
import { CheckIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import type {
	DateFilterOption,
	DateRangeFilterOption,
	DateRangeValue,
	FilterOption,
	SelectFilterOption,
	SelectOptionItem,
} from "./types";
import { useFilters } from "./use-filters";

export const FiltersCurrentList = () => {
	const { options } = useFilters();

	return (
		<AnimatePresence mode="popLayout">
			{Object.entries(options).map(([key, option]) => {
				return <FilterCurrentItem key={key} option={option} />;
			})}
		</AnimatePresence>
	);
};

const FilterCurrentItem = ({ option }: { option: FilterOption }) => {
	switch (option.type) {
		case "select":
			return <SelectFilterCurrentItem option={option} />;
		case "date":
			return <DateFilterCurrentItem option={option} />;
		case "date-range":
			return <DateRangeFilterCurrentItem option={option} />;
		default:
			return <SelectFilterCurrentItem option={option} />;
	}
};

// ============================================================================
// Select Filter Current Item
// ============================================================================

const SelectFilterCurrentItem = ({
	option,
}: {
	option: SelectFilterOption;
}) => {
	const { filters, setFilters } = useFilters();
	const filterValue = filters[option.filterKey as keyof typeof filters];
	const noValue =
		!filterValue || (Array.isArray(filterValue) && filterValue.length === 0);

	const { data } = useQuery(option.queryOptions);
	const safeData = (data ?? []) as SelectOptionItem[];

	const displayValue = useMemo(() => {
		if (Array.isArray(filterValue)) {
			return safeData.filter((item) =>
				filterValue.includes(item.value as never),
			);
		}
		return safeData.find((item) => item.value === filterValue);
	}, [filterValue, safeData]);

	const handleToggle = (value: string) => {
		if (option.multiple) {
			const currentValues = (filterValue as string[]) ?? [];
			if (currentValues.includes(value)) {
				setFilters({
					[option.filterKey]: currentValues.filter((v) => v !== value),
				});
			} else {
				setFilters({
					[option.filterKey]: [...currentValues, value],
				});
			}
		} else {
			if (filterValue === value) {
				setFilters({ [option.filterKey]: undefined });
			} else {
				setFilters({ [option.filterKey]: value });
			}
		}
	};

	if (noValue) return null;

	return (
		<FilterCurrentItemWrapper
			onClear={() => setFilters({ [option.filterKey]: null })}
		>
			<DropdownMenuTrigger asChild>
				<button type="button" className="flex items-center gap-1">
					<span className="text-muted-foreground">{option.label}</span>
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
						) : displayValue ? (
							<div className="flex items-center gap-1">
								{displayValue.icon}
								<span className="max-w-32 truncate">{displayValue.label}</span>
							</div>
						) : null}
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{safeData.map((item) => (
					<DropdownMenuCheckboxItem
						checked={
							Array.isArray(filterValue)
								? filterValue.includes(item.value as never)
								: filterValue === item.value
						}
						onCheckedChange={() => handleToggle(item.value)}
						key={item.value}
					>
						{item.icon}
						{item.label}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</FilterCurrentItemWrapper>
	);
};

// ============================================================================
// Date Filter Current Item
// ============================================================================

const DateFilterCurrentItem = ({ option }: { option: DateFilterOption }) => {
	const { filters, setFilters } = useFilters();
	const filterValue = filters[option.filterKey as keyof typeof filters] as
		| string
		| undefined;

	if (!filterValue) return null;

	const selectedPreset = option.options.find(
		(opt) => opt.value === filterValue,
	);

	const displayLabel = selectedPreset
		? selectedPreset.label
		: format(new Date(filterValue), "MMM d, yyyy");

	const handleSelect = (value: string) => {
		if (filterValue === value) {
			setFilters({ [option.filterKey]: undefined });
		} else {
			setFilters({ [option.filterKey]: value });
		}
	};

	return (
		<FilterCurrentItemWrapper
			onClear={() => setFilters({ [option.filterKey]: null })}
		>
			<DropdownMenuTrigger asChild>
				<button type="button" className="flex items-center gap-1">
					<span className="text-muted-foreground">{option.label}</span>
					is
					<span>{displayLabel}</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{option.options.map((item) => (
					<DropdownMenuItem
						key={item.value}
						onSelect={() => handleSelect(item.value)}
						className="flex items-center justify-between"
					>
						<span>{item.label}</span>
						{filterValue === item.value && (
							<CheckIcon className="size-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</FilterCurrentItemWrapper>
	);
};

// ============================================================================
// Date Range Filter Current Item
// ============================================================================

const areDateRangesEqual = (
	a: DateRangeValue | undefined,
	b: DateRangeValue | undefined,
): boolean => {
	if (!a || !b) return false;
	return a[0] === b[0] && a[1] === b[1];
};

const DateRangeFilterCurrentItem = ({
	option,
}: {
	option: DateRangeFilterOption;
}) => {
	const { filters, setFilters } = useFilters();
	const filterValue = filters[option.filterKey as keyof typeof filters] as
		| DateRangeValue
		| undefined;

	const selectedPreset = filterValue
		? option.options.find((opt) => areDateRangesEqual(opt.value, filterValue))
		: undefined;

	const displayLabel = useMemo(() => {
		if (!filterValue) return null;
		if (selectedPreset) return selectedPreset.label;
		const [start, end] = filterValue;
		const startDate = format(new Date(start), "MMM d");
		const endDate = format(new Date(end), "MMM d, yyyy");
		return `${startDate} – ${endDate}`;
	}, [filterValue, selectedPreset]);

	if (!filterValue) return null;

	const handleSelect = (value: DateRangeValue) => {
		if (areDateRangesEqual(filterValue, value)) {
			setFilters({ [option.filterKey]: undefined });
		} else {
			setFilters({ [option.filterKey]: value });
		}
	};

	return (
		<FilterCurrentItemWrapper
			onClear={() => setFilters({ [option.filterKey]: null })}
		>
			<DropdownMenuTrigger asChild>
				<button type="button" className="flex items-center gap-1">
					<span className="text-muted-foreground">{option.label}</span>
					is
					<span>{displayLabel}</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{option.options.map((item) => (
					<DropdownMenuItem
						key={item.label}
						onSelect={() => handleSelect(item.value)}
						className="flex items-center justify-between"
					>
						<span>{item.label}</span>
						{areDateRangesEqual(filterValue, item.value) && (
							<CheckIcon className="size-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</FilterCurrentItemWrapper>
	);
};

// ============================================================================
// Shared Wrapper Component
// ============================================================================

interface FilterCurrentItemWrapperProps {
	onClear: () => void;
	children: React.ReactNode;
}

const FilterCurrentItemWrapper = ({
	onClear,
	children,
}: FilterCurrentItemWrapperProps) => {
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
			whileHover="hover"
		>
			<DropdownMenu>
				<div className="flex h-7 gap-1 rounded-sm border px-2 text-xs">
					{children}
					<motion.button
						className="text-destructive"
						variants={{
							hover: { width: "auto", opacity: 1 },
							initial: { width: 0, opacity: 0 },
						}}
						onClick={(e) => {
							e.stopPropagation();
							onClear();
						}}
					>
						<XIcon className="size-4" />
					</motion.button>
				</div>
			</DropdownMenu>
		</motion.div>
	);
};
