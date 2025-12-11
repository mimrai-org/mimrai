import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

export const useTaskDependencyParams = () => {
	const [params, setParams] = useQueryStates({
		taskDependentId: parseAsString,
		dependencyType: parseAsStringLiteral(["blocks", "relates_to"]),
		dependencyDirection: parseAsStringLiteral(["to", "from"]),
	});

	return {
		...params,
		setParams,
	};
};
