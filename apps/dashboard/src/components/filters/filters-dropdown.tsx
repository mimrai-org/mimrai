"use client";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { Input } from "@ui/components/ui/input";
import { ListFilter } from "lucide-react";
import { useState } from "react";
import { FilterDateContent } from "./filter-date-content";
import { FilterDateRangeContent } from "./filter-date-range-content";
import { FilterSelectContent } from "./filter-select-content";
import { FiltersCurrentList } from "./filters-current";
import type { FilterOption } from "./types";
import { useFilters } from "./use-filters";

export const FiltersDropdown = () => {
	const [globalSearch, setGlobalSearch] = useState("");
	const { options } = useFilters();

	const hasOptions = Object.keys(options).length > 0;

	if (!hasOptions) return null;

	return (
		<div className="flex flex-wrap items-center gap-2">
			<FiltersCurrentList />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button size="sm" variant="ghost">
						<ListFilter />
						Filters
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="min-w-56">
					<DropdownMenuGroup className="p-1">
						<Input
							placeholder="Type to search..."
							value={globalSearch}
							onChange={(e) => setGlobalSearch(e.target.value)}
							variant="ghost"
						/>
					</DropdownMenuGroup>
					<DropdownMenuGroup>
						{Object.entries(options).map(([key, option]) => (
							<FilterOptionContent
								key={key}
								option={option}
								globalSearch={globalSearch}
							/>
						))}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

interface FilterOptionContentProps {
	option: FilterOption;
	globalSearch: string;
}

const FilterOptionContent = ({
	option,
	globalSearch,
}: FilterOptionContentProps) => {
	switch (option.type) {
		case "select":
			return (
				<FilterSelectContent option={option} globalSearch={globalSearch} />
			);
		case "date":
			return <FilterDateContent option={option} globalSearch={globalSearch} />;
		case "date-range":
			return (
				<FilterDateRangeContent option={option} globalSearch={globalSearch} />
			);
		default:
			return (
				<FilterSelectContent option={option} globalSearch={globalSearch} />
			);
	}
};
