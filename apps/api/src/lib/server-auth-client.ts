import { createAuthClient } from "better-auth/client";
import { apiKeyClient } from "better-auth/client/plugins";

export const authServerClient = createAuthClient({
	plugins: [apiKeyClient()],
});
