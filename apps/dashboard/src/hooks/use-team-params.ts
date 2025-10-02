import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export const useTeamParams = () => {
	const [params, setParams] = useQueryStates({
		createTeam: parseAsBoolean,
		teamId: parseAsString,
	});

	return {
		...params,
		setParams,
	};
};
