import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useColumnParams() {
	const [params, setParams] = useQueryStates({
		columnId: parseAsString,
		createColumn: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
}
