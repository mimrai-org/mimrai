import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const tasksFilterParams = {
	assigneeId: parseAsArrayOf(parseAsString),
	taskProjectId: parseAsArrayOf(parseAsString),
	search: parseAsString,
	labels: parseAsArrayOf(parseAsString),
};

export const useTasksFilterParams = () => {
	const [params, setParams] = useQueryStates(tasksFilterParams);

	return {
		...params,
		hasParams: Object.values(params).some((v) => Boolean(v && v.length !== 0)),
		setParams,
	};
};

export const loadTasksFilterParams = createLoader(tasksFilterParams);
