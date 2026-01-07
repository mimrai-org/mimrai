export interface FilterOption {
	label: string;
	multiple: boolean;
	icon: React.ReactNode;
	filterKey: string;
	queryOptions: any;
}

export type FilterOptions = Record<string, FilterOption>;
