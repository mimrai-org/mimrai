import type { Scope } from "@mimir/api/scopes";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export const useUser = () => {
	const { data } = useQuery(trpc.users.getCurrent.queryOptions());

	return data;
};

export const useScopes = (scopes: Scope[]) => {
	const user = useUser();

	if (!user) return false;

	if (scopes.length === 0) return true;

	if (user.team.scopes.length === 0) return false;

	// Check if user has all required scopes
	return user.team.scopes.every((scope) => scopes.includes(scope));
};
