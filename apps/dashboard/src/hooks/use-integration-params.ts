import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export const useIntegrationParams = () => {
	const [params, setParams] = useQueryStates({
		installType: parseAsString,
		linkUser: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
};
