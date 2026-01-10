import { useQueryStates } from "nuqs";
import {
	parseAsArrayOf,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";

export const inboxFilterParams = {
	status: parseAsArrayOf(
		parseAsStringLiteral(["pending", "archived"]),
	).withDefault(["pending"]),
	selectedInboxId: parseAsString,
};

export const useInboxFilterParams = () => {
	const [params, setParams] = useQueryStates(inboxFilterParams);

	return {
		params,
		setParams,
	};
};
