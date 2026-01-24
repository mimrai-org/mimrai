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
import { useMemo, useState } from "react";
import type { DateFilterOption } from "./types";
import { useFilters } from "./use-filters";

interface FilterDateContentProps {
	option: DateFilterOption;
	globalSearch: string;
}

export const FilterDateContent = ({
	option,
	globalSearch,
}: FilterDateContentProps) => {
	const { setFilters, filters } = useFilters();
	const [showCalendar, setShowCalendar] = useState(false);

	const currentValue = filters[option.filterKey as keyof typeof filters] as
		| string
		| undefined;

	const filteredOptions = useMemo(() => {
		if (!globalSearch) return option.options;
		return option.options.filter((item) =>
			item.label.toLowerCase().includes(globalSearch.toLowerCase()),
		);
	}, [option.options, globalSearch]);

	const handleSelect = (value: string | undefined) => {
		if (currentValue === value) {
			setFilters({ [option.filterKey]: undefined });
		} else {
			setFilters({ [option.filterKey]: value });
		}
	};

	const handleCalendarSelect = (date: Date | undefined) => {
		if (date) {
			handleSelect(date.toISOString());
			setShowCalendar(false);
		}
	};

	const selectedPreset = option.options.find(
		(opt) => opt.value === currentValue,
	);

	const displayLabel = useMemo(() => {
		if (selectedPreset) return selectedPreset.label;
		if (currentValue) {
			return format(new Date(currentValue), "MMM d, yyyy");
		}
		return null;
	}, [currentValue, selectedPreset]);

	// Show submenu when more than 2 options or no global search match
	if (filteredOptions.length > 2 || showCalendar) {
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
					{filteredOptions.map((item) => (
						<DropdownMenuItem
							key={item.value}
							onSelect={() => handleSelect(item.value)}
							className="flex items-center justify-between"
						>
							<span>{item.label}</span>
							{currentValue === item.value && (
								<CheckIcon className="size-4 text-primary" />
							)}
						</DropdownMenuItem>
					))}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<CalendarIcon className="mr-2 size-4" />
							Custom date
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="p-0">
							<Calendar
								mode="single"
								selected={currentValue ? new Date(currentValue) : undefined}
								onSelect={handleCalendarSelect}
								captionLayout="dropdown"
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
			{filteredOptions.map((item) => (
				<DropdownMenuItem
					textValue="#"
					key={item.value}
					onSelect={() => handleSelect(item.value)}
				>
					<div className="flex items-center gap-1 text-muted-foreground">
						{option.label}
						<ChevronRightIcon className="size-3" />
					</div>
					{item.label}
					{currentValue === item.value && (
						<CheckIcon className="ml-auto size-4 text-primary" />
					)}
				</DropdownMenuItem>
			))}
		</>
	);
};
