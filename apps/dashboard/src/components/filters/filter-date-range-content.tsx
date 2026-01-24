"use client";
import { Calendar } from "@ui/components/ui/calendar";
import {
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui/components/ui/dropdown-menu";
import { format } from "date-fns";
import { CalendarIcon, CheckIcon, ChevronRightIcon } from "lucide-react";
import { useMemo } from "react";
import type { DateRangeFilterOption, DateRangeValue } from "./types";
import { useFilters } from "./use-filters";

interface FilterDateRangeContentProps {
	option: DateRangeFilterOption;
	globalSearch: string;
}

const areDateRangesEqual = (
	a: DateRangeValue | undefined,
	b: DateRangeValue | undefined,
): boolean => {
	if (!a || !b) return false;
	return a[0] === b[0] && a[1] === b[1];
};

export const FilterDateRangeContent = ({
	option,
	globalSearch,
}: FilterDateRangeContentProps) => {
	const { setFilters, filters } = useFilters();

	const currentValue = filters[option.filterKey as keyof typeof filters] as
		| DateRangeValue
		| undefined;

	const filteredOptions = useMemo(() => {
		if (!globalSearch) return option.options;
		return option.options.filter((item) =>
			item.label.toLowerCase().includes(globalSearch.toLowerCase()),
		);
	}, [option.options, globalSearch]);

	const handleSelect = (value: DateRangeValue | undefined) => {
		if (areDateRangesEqual(currentValue, value)) {
			setFilters({ [option.filterKey]: undefined });
		} else {
			setFilters({ [option.filterKey]: value });
		}
	};

	const handleCalendarSelect = (
		range: { from?: Date; to?: Date } | undefined,
	) => {
		if (range?.from && range?.to) {
			handleSelect([range.from.toISOString(), range.to.toISOString()]);
		} else if (range?.from) {
			// Partial selection - wait for second date
		}
	};

	const selectedPreset = option.options?.find((opt) =>
		areDateRangesEqual(opt.value, currentValue),
	);

	const displayLabel = useMemo(() => {
		if (selectedPreset) return selectedPreset.label;
		if (currentValue) {
			const [start, end] = currentValue;
			const startDate = format(new Date(start), "MMM d");
			const endDate = format(new Date(end), "MMM d, yyyy");
			return `${startDate} – ${endDate}`;
		}
		return null;
	}, [currentValue, selectedPreset]);

	const calendarValue = useMemo(() => {
		if (!currentValue) return undefined;
		return {
			from: new Date(currentValue[0]),
			to: new Date(currentValue[1]),
		};
	}, [currentValue]);

	// Show submenu when more than 2 options
	if (filteredOptions?.length > 2) {
		return (
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					<div className="flex items-center gap-2">
						<div className="size-4">{option.icon}</div>
						{option.label}
						{displayLabel && (
							<span className="ml-auto text-muted-foreground text-xs">
								{displayLabel}
							</span>
						)}
					</div>
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className="min-w-48">
					{filteredOptions?.map((item) => (
						<DropdownMenuItem
							key={item.label}
							onSelect={() => handleSelect(item.value)}
							className="flex items-center justify-between"
						>
							<span>{item.label}</span>
							{areDateRangesEqual(currentValue, item.value) && (
								<CheckIcon className="size-4 text-primary" />
							)}
						</DropdownMenuItem>
					))}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<CalendarIcon className="mr-2 size-4" />
							Custom range
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="p-0">
							<Calendar
								mode="range"
								selected={calendarValue}
								onSelect={handleCalendarSelect}
								captionLayout="dropdown"
								numberOfMonths={2}
							/>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		);
	}

	// Show flat list when 2 or fewer options match global search
	return (
		<>
			{filteredOptions?.map((item) => (
				<DropdownMenuItem
					textValue="#"
					key={item.label}
					onSelect={() => handleSelect(item.value)}
				>
					<div className="flex items-center gap-1 text-muted-foreground">
						{option.label}
						<ChevronRightIcon className="size-3" />
					</div>
					{item.label}
					{areDateRangesEqual(currentValue, item.value) && (
						<CheckIcon className="ml-auto size-4 text-primary" />
					)}
				</DropdownMenuItem>
			))}
		</>
	);
};
