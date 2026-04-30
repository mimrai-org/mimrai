import { getApiUrl } from "@mimir/utils/envs";
import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";

function cleanUrl(url: string | undefined): string | undefined {
	if (!url) return undefined;
	return url.replace(/^\ufeff/, "").trim();
}

export const authClient = createAuthClient({
	baseURL: cleanUrl(process.env.NEXT_PUBLIC_SERVER_URL) || getApiUrl(),
	plugins: [nextCookies()],
});

export const useSession = authClient.useSession;
