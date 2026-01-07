import type { Scope } from "@mimir/api/scopes";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export const useUser = (
	params: { refetchOnMount?: boolean; refetchOnWindowFocus?: boolean } = {
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	},
) => {
	const { refetchOnMount, refetchOnWindowFocus } = params;

	const { data } = useQuery(
		trpc.users.getCurrent.queryOptions(undefined, {
			refetchOnMount,
			refetchOnWindowFocus,
			staleTime: 30 * 60 * 1000, // 30 minutes
		}),
	);

	if (!data) return null;

	return {
		...data,
		basePath: data?.team ? `/team/${data.team.slug}` : "",
	};
};

export const useScopes = (scopes: Scope[]) => {
	const user = useUser();

	if (!user) return false;

	if (scopes.length === 0) return true;

	if (!user.team) return false;
	if (!user.team.scopes) return false;

	if (user.team.scopes.length === 0) return false;

	// Check if user has all required scopes
	return user.team.scopes.every((scope) => scopes.includes(scope));
};
