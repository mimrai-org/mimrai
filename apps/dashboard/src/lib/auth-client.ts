import type { auth } from "@mimir/api/auth";
import { polarClient } from "@polar-sh/better-auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
	plugins: [inferAdditionalFields<typeof auth>(), polarClient()],
});

export const useSession = authClient.useSession;
