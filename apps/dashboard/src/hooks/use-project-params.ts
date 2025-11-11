import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useProjectParams() {
	const [params, setParams] = useQueryStates({
		projectId: parseAsString,
		createProject: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
}
