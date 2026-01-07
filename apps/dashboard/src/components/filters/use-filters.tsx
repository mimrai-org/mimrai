"use client";
import { createContext, useContext } from "react";
import type { FilterOptions } from "./types";

export interface FiltersContextValue {
	options: FilterOptions;
	setFilters: (newFilters: Record<string, any>) => void;
	filters: Record<string, any>;
}

export const FiltersContext = createContext<FiltersContextValue | undefined>(
	undefined,
);

export const FiltersProvider = ({
	options,
	setFilters,
	filters,
	children,
}: {
	options: FilterOptions;
	setFilters: (newFilters: Record<string, any>) => void;
	filters: Record<string, any>;
	children: React.ReactNode;
}) => {
	return (
		<FiltersContext.Provider
			value={{
				options,
				setFilters,
				filters,
			}}
		>
			{children}
		</FiltersContext.Provider>
	);
};

export const useFilters = () => {
	const context = useContext(FiltersContext);
	if (!context) {
		throw new Error("useFilters must be used within a FiltersProvider");
	}
	return context;
};
