import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useMcpServerParams() {
	const [params, setParams] = useQueryStates({
		mcpServerId: parseAsString,
		createMcpServer: parseAsBoolean,
	});

	return {
		...params,
		setParams,
	};
}
