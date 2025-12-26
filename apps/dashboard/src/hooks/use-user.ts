import type { Scope } from "@mimir/api/scopes";
import { useOpenPanel } from "@mimir/events/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
		}),
	);
	const identified = useRef(false);

	const { identify } = useOpenPanel();
	useEffect(() => {
		if (!data || !data.id) return;
		if (process.env.NODE_ENV === "development") return;
		if (identified.current) return;
		identify({
			profileId: data.id!,
			avatar: data.image || "",
			firstName: data.name?.split(" ")?.[0] || "",
			lastName: data.name?.split(" ")?.[1] || "",
			email: data.email || "",
		});
		identified.current = true;
	}, [data]);

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
