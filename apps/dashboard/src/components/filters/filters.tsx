"use client";
import { Input } from "@mimir/ui/input";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { FiltersDropdown } from "./filters-dropdown";
import { useFilters } from "./use-filters";

export const Filters = ({ children }: { children?: React.ReactNode }) => {
	return (
		<div className="flex items-center justify-between gap-4 rounded-md">
			<div className="flex w-full items-center gap-2">
				<FiltersDropdown />
				{children}
			</div>
		</div>
	);
};

export const FiltersSearchInput = ({
	placeholder = "Search...",
}: {
	placeholder?: string;
}) => {
	const { filters, setFilters } = useFilters();

	const [search, setSearch] = useState(filters.search || "");

	const debouncedSetFilters = useDebounceCallback(setFilters, 500);
	const firstRender = useRef(true);

	useEffect(() => {
		if (firstRender.current) return;
		setTimeout(() => {
			firstRender.current = false;
		}, 1000);
	}, []);

	useEffect(() => {
		debouncedSetFilters({
			search: search,
		});
		// Cleanup: cancel pending debounced call on unmount or when search changes
		return () => {
			debouncedSetFilters.cancel();
		};
	}, [search, debouncedSetFilters]);

	return (
		<div className="relative flex items-center">
			<SearchIcon className="absolute left-2 size-4 text-muted-foreground" />
			<Input
				variant={"ghost"}
				placeholder={placeholder}
				className="w-52 pl-8"
				value={search || ""}
				onChange={(e) => setSearch(e.target.value)}
			/>
		</div>
	);
};
