import type { auth } from "@api/lib/auth";
import { apiKeyClient, customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
	fetchOptions: {
		credentials: "include",
	},
	plugins: [customSessionClient<typeof auth>(), apiKeyClient()],
});

export const useSession = authClient.useSession;
