import type { Scope } from "@api/lib/scopes";
import { useUser } from "@/components/user-provider";

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
