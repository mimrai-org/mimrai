import { headers } from "next/headers";
import { authClient } from "./auth-client";

export const getSession = async () => {
	const { data: session } = await authClient.getSession({
		fetchOptions: {
			headers: {
				cookie: (await headers()).get("cookie") || "",
			},
			credentials: "include",
			cache: "force-cache",

			// For measuring performance of getSession, temporary
			onRequest: () => {
				console.time("getSession");
			},
			onResponse: () => {
				console.timeEnd("getSession");
			},
		},
	});

	const teamId = (session?.user as any)?.teamId as string | undefined;
	const teamSlug = (session?.user as any)?.teamSlug as string | undefined;

	return {
		...session,
		user: {
			...session?.user,
			teamId: teamId || null,
			teamSlug: teamSlug || null,
		},
	};
};
