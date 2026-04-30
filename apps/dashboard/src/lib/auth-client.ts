import type { auth } from "@api/lib/auth";
import { getApiUrl } from "@mimir/utils/envs";
import { apiKeyClient, customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

function cleanUrl(url: string | undefined): string | undefined {
	if (!url) return undefined;
	return url.replace(/^\ufeff/, "").trim();
}

export const authClient = createAuthClient({
	baseURL: cleanUrl(process.env.NEXT_PUBLIC_SERVER_URL) || getApiUrl(),
	fetchOptions: {
		credentials: "include",
	},
	plugins: [customSessionClient<typeof auth>(), apiKeyClient()],
});

export const useSession = authClient.useSession;
