import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const tasksFilterParams = {
	assigneeId: parseAsArrayOf(parseAsString),
	search: parseAsString,
};

export const useTasksFilterParams = () => {
	const [params, setParams] = useQueryStates(tasksFilterParams);

	return {
		...params,
		setParams,
	};
};

export const loadTasksFilterParams = createLoader(tasksFilterParams);
