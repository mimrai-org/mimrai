import type { auth } from "@api/lib/auth";
import { customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
	plugins: [customSessionClient<typeof auth>()],
});

export const useSession = authClient.useSession;
