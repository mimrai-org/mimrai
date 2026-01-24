"use client";
import { useQuery } from "@tanstack/react-query";
import {
	DropdownMenuCheckboxItem,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui/components/ui/dropdown-menu";
import { Input } from "@ui/components/ui/input";
import { ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { SelectFilterOption, SelectOptionItem } from "./types";
import { useFilters } from "./use-filters";

interface FilterSelectContentProps {
	option: SelectFilterOption;
	globalSearch: string;
}

export const FilterSelectContent = ({
	option,
	globalSearch,
}: FilterSelectContentProps) => {
	const [search, setSearch] = useState("");
	const { setFilters, filters } = useFilters();

	const { data } = useQuery(option.queryOptions);
	const safeData = (data ?? []) as SelectOptionItem[];

	const globalResults = useMemo(() => {
		if (!globalSearch) return safeData;
		return safeData.filter((item) =>
			item.label.toLowerCase().includes(globalSearch.toLowerCase()),
		);
	}, [safeData, globalSearch]);

	const localResults = useMemo(() => {
		if (!search) return safeData;
		return safeData.filter((item) =>
			item.label.toLowerCase().includes(search.toLowerCase()),
		);
	}, [safeData, search]);

	const handleToggle = (value: string) => {
		const filterValue = filters[option.filterKey as keyof typeof filters];

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

	const isChecked = (value: string) => {
		const filterValue = filters[option.filterKey as keyof typeof filters];
		if (option.multiple) {
			return ((filterValue as string[]) ?? []).includes(value);
		}
		return filterValue === value;
	};

	// Show submenu with search when more than 2 results
	if (globalResults.length > 2) {
		return (
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					<div className="flex items-center gap-2">
						<div className="size-4">{option.icon}</div>
						{option.label}
					</div>
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent>
					<DropdownMenuGroup className="p-1">
						<Input
							placeholder={`Search ${option.label}...`}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							variant="ghost"
						/>
					</DropdownMenuGroup>
					<DropdownMenuGroup>
						{localResults.map((item) => (
							<DropdownMenuCheckboxItem
								textValue="#"
								key={item.value}
								checked={isChecked(item.value)}
								onSelect={(e) => e.preventDefault()}
								onCheckedChange={() => handleToggle(item.value)}
							>
								{item.icon}
								{item.label}
							</DropdownMenuCheckboxItem>
						))}
					</DropdownMenuGroup>
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		);
	}

	// Show flat list when 2 or fewer results
	return (
		<>
			{globalResults.map((item) => (
				<DropdownMenuItem
					textValue="#"
					key={item.value}
					onSelect={() => handleToggle(item.value)}
				>
					{item.icon}
					<div className="flex items-center gap-1 text-muted-foreground">
						{option.label}
						<ChevronRightIcon className="size-3" />
					</div>
					{item.label}
				</DropdownMenuItem>
			))}
		</>
	);
};
