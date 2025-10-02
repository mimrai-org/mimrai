import { parseAsString, useQueryStates } from "nuqs";

export const useIntegrationParams = () => {
	const [params, setParams] = useQueryStates({
		installType: parseAsString,
	});

	return {
		...params,
		setParams,
	};
};
