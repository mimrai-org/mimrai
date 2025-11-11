import { task } from "better-auth/react";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useTaskParams() {
	const [params, setParams] = useQueryStates({
		taskId: parseAsString,
		taskColumnId: parseAsString,
		taskProjectId: parseAsString,
		createTask: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
}
