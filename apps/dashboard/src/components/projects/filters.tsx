import { Filters, FiltersSearchInput } from "../filters/filters";
import { FiltersProvider } from "../filters/use-filters";
import { projectsFilterOptions } from "./filters-options";
import { useProjectsFilterParams } from "./use-projects-filter-params";

export const ProjectsFilters = () => {
	const { params, setParams } = useProjectsFilterParams();

	return (
		<FiltersProvider
			filters={params}
			setFilters={setParams}
			options={projectsFilterOptions}
		>
			<Filters>
				<FiltersSearchInput placeholder="Search projects..." />
			</Filters>
		</FiltersProvider>
	);
};
