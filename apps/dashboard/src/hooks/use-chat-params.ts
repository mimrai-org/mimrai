import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export const useChatParams = () => {
	const [params, setParams] = useQueryStates({
		chatId: parseAsString,
		toggleChat: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
};
