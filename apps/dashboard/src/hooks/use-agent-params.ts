import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useAgentParams() {
	const [params, setParams] = useQueryStates({
		agentId: parseAsString,
		createAgent: parseAsBoolean,
		agentMemoryId: parseAsString,
	});

	return {
		...params,
		setParams,
	};
}
