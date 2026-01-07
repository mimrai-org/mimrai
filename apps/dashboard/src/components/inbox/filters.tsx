import { Filters } from "../filters/filters";
import { FiltersProvider } from "../filters/use-filters";
import { inboxFilterOptions } from "./filters-options";
import { useInboxFilterParams } from "./use-inbox-filter-params";

export const InboxFilters = () => {
	const { params, setParams } = useInboxFilterParams();

	console.log({ params });

	return (
		<FiltersProvider
			filters={params}
			setFilters={setParams}
			options={inboxFilterOptions}
		>
			<Filters />
		</FiltersProvider>
	);
};
