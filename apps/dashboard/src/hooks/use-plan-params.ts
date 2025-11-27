import { parseAsBoolean, useQueryStates } from "nuqs";

export function usePlanParams() {
	const [params, setParams] = useQueryStates({
		selectPlan: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
}
