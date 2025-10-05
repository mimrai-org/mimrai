import { parseAsString, useQueryStates } from "nuqs";

export function useMemberParams() {
	const [params, setParams] = useQueryStates({
		memberId: parseAsString,
	});

	return {
		...params,
		setParams,
	};
}
