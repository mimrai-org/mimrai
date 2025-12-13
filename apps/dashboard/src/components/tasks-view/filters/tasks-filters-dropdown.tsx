"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { Input } from "@ui/components/ui/input";
import { ChevronRightIcon, ListFilter } from "lucide-react";
import { useMemo, useState } from "react";
import { useTasksViewContext } from "../tasks-view";
import { TasksFiltersCurrentList } from "./tasks-filters-current";
import { tasksFilterOptions } from "./tasks-filters-options";

export const TasksFiltersDropdown = () => {
	const [globalSearch, setGlobalSearch] = useState("");
	return (
		<div className="flex items-center gap-2">
			<TasksFiltersCurrentList />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button size={"sm"} variant="ghost">
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
							variant={"ghost"}
						/>
					</DropdownMenuGroup>
					<DropdownMenuGroup>
						{Object.entries(tasksFilterOptions).map(([key, option]) => (
							<TasksFiltersDropdownSub
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

export const TasksFiltersDropdownSub = ({
	option,
	globalSearch,
}: {
	option: (typeof tasksFilterOptions)[keyof typeof tasksFilterOptions];
	globalSearch: string;
}) => {
	const [search, setSearch] = useState("");
	const { setFilters, filters } = useTasksViewContext();

	// @ts-expect-error
	const { data } = useQuery(option.queryOptions);

	const globalResults = useMemo(() => {
		if (!globalSearch) return data;
		return (
			data?.filter((item) =>
				item.label.toLowerCase().includes(globalSearch.toLowerCase()),
			) || []
		);
	}, [data, globalSearch]);

	const localResults = useMemo(() => {
		if (!search) return data;
		return (
			data?.filter((item) =>
				item.label.toLowerCase().includes(search.toLowerCase()),
			) || []
		);
	}, [data, search]);

	const handleToggle = (value: string) => {
		if (option.multiple) {
			const filterValue = filters[
				option.filterKey as keyof typeof filters
			] as any[];
			if (filterValue?.includes(value as any)) {
				setFilters({
					[option.filterKey]: filterValue.filter((v) => v !== value),
				});
			} else {
				setFilters({
					[option.filterKey]: [...(filterValue ?? []), value],
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

	if (globalResults?.length > 2) {
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
							variant={"ghost"}
						/>
					</DropdownMenuGroup>
					<DropdownMenuGroup>
						{localResults?.map((item) => (
							<DropdownMenuCheckboxItem
								textValue="#"
								key={item.value}
								checked={
									option.multiple
										? (
												filters[
													option.filterKey as keyof typeof filters
												] as any[]
											)?.includes(item.value as any)
										: filters[option.filterKey as keyof typeof filters] ===
											item.value
								}
								onSelect={(e) => e.preventDefault()}
								onCheckedChange={() => {
									handleToggle(item.value);
								}}
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

	return (
		<>
			{globalResults?.map((item) => (
				<DropdownMenuItem
					textValue="#"
					key={item.value}
					onSelect={() => {
						handleToggle(item.value);
					}}
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
