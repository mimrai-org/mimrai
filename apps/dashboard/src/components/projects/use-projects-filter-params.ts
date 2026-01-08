import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";

export const projectsFilterParams = {
	search: parseAsString,
};

export const useProjectsFilterParams = () => {
	const [params, setParams] = useQueryStates(projectsFilterParams);

	return {
		params,
		setParams,
	};
};
