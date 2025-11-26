import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export const useShareableParams = () => {
	const [params, setParams] = useQueryStates({
		shareableId: parseAsString,
		shareableResourceId: parseAsString,
		shareableResourceType: parseAsString,
		createShareable: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
};
