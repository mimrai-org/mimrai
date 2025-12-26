import { parseAsString, useQueryStates } from "nuqs";

export function useProjectHealthUpdateParams() {
	const [params, setParams] = useQueryStates({
		healthUpdateId: parseAsString,
	});

	return {
		...params,
		setParams,
	};
}
