import { parseAsString, useQueryStates } from "nuqs";

export const useChatParams = () => {
	const [params, setParams] = useQueryStates({
		chatId: parseAsString,
	});

	return {
		...params,
		setParams,
	};
};
