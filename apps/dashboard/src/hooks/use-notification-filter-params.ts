import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const notificationFilterParams = {
	status: parseAsArrayOf(parseAsString),
	search: parseAsString,
};

export const useNotificationFilterParams = () => {
	const [params, setParams] = useQueryStates(notificationFilterParams);

	return {
		...params,
		hasParams: Object.values(params).some((v) => Boolean(v && v.length !== 0)),
		setParams,
	};
};

export const loadNotificationFilterParams = createLoader(
	notificationFilterParams,
);
