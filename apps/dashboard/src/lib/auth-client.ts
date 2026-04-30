import type { auth } from "@api/lib/auth";
import { getApiUrl } from "@mimir/utils/envs";
import { apiKeyClient, customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL || getApiUrl(),
	fetchOptions: {
		credentials: "include",
	},
	plugins: [customSessionClient<typeof auth>(), apiKeyClient()],
});

export const useSession = authClient.useSession;
