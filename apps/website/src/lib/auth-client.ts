import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
	plugins: [nextCookies()],
});

export const useSession = authClient.useSession;
