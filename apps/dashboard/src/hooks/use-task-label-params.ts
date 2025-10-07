import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useLabelParams() {
	const [params, setParams] = useQueryStates({
		labelId: parseAsString,
		createLabel: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
}
