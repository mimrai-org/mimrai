import { headers } from "next/headers";
import { authClient } from "./auth-client";

export const getSession = async () => {
	const { data: session } = await authClient.getSession({
		fetchOptions: {
			headers: {
				cookie: (await headers()).get("cookie") || "",
			},
			credentials: "include",
			onRequest(context) {
				console.log("Requesting session:", context);
			},
			onResponse(context) {
				console.log("Received session response:", context);
			},
		},
	});

	return session;
};
