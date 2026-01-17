import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useTaskViewParams() {
	const [params, setParams] = useQueryStates({
		viewId: parseAsString,
		createTaskView: parseAsBoolean,
		taskViewProjectId: parseAsString,
		taskViewName: parseAsString,
		taskViewDescription: parseAsString,
		taskViewType: parseAsString,
	});

	return {
		...params,
		setParams,
	};
}
