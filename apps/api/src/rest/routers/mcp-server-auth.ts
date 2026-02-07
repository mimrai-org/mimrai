import { OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@mimir/db/client";
import { getMcpServerById } from "@mimir/db/queries/mcp-servers";
import { getTeamById } from "@mimir/db/queries/teams";
import {
	integrationUserLink,
	type McpServerConfig,
	session,
} from "@mimir/db/schema";
import { getApiUrl, getAppUrl } from "@mimir/utils/envs";
import { eq } from "drizzle-orm";
import type { Context } from "../types";

/**
 * MCP Server OAuth Authentication Flow
 *
 * Handles the OAuth authorization flow for MCP servers that require authentication.
 *
 * Flow:
 * 1. Dashboard redirects to GET /:id/authorize
 * 2. Discovers the MCP server's OAuth metadata via .well-known endpoints
 * 3. Generates PKCE parameters, stores state in the session, and redirects to the auth endpoint
 * 4. After user authorizes, the MCP server redirects to GET /callback
 * 5. Exchanges the code for tokens, stores them as an integration user link, and redirects back
 *
 * The tokens are stored per-user in the `integrationUserLink` table so each user
 * authenticates independently. The tool registry injects these tokens when creating MCP clients.
 */

const app = new OpenAPIHono<Context>();

const MCP_AUTH_SESSION_KEY = "mcpServerAuth";

interface McpServerAuthState {
	mcpServerId: string;
	codeVerifier: string;
	clientId: string;
	state: string;
}

interface OAuthMetadata {
	authorizationEndpoint: string;
	tokenEndpoint: string;
	registrationEndpoint?: string;
	scopesSupported?: string[];
}

// ─── OAuth Helpers ───────────────────────────────────────────────────────────

/**
 * Discover the OAuth authorization server metadata from an MCP server URL.
 * Follows the MCP spec: try /.well-known/oauth-authorization-server, then
 * fall back to /.well-known/openid-configuration.
 */
async function discoverAuthMetadata(serverUrl: string): Promise<OAuthMetadata> {
	const origin = new URL(serverUrl).origin;
	const wellKnownUrls = [
		`${origin}/.well-known/oauth-authorization-server`,
		`${origin}/.well-known/openid-configuration`,
	];

	for (const url of wellKnownUrls) {
		try {
			const response = await fetch(url, {
				headers: { Accept: "application/json" },
			});
			if (!response.ok) continue;

			const metadata = await response.json();
			if (metadata.authorization_endpoint && metadata.token_endpoint) {
				return {
					authorizationEndpoint: metadata.authorization_endpoint,
					tokenEndpoint: metadata.token_endpoint,
					registrationEndpoint: metadata.registration_endpoint,
					scopesSupported: metadata.scopes_supported,
				};
			}
		} catch {}
	}

	throw new Error(
		"Could not discover OAuth metadata for this MCP server. It may not support authentication.",
	);
}

/**
 * Generate a cryptographically random string for PKCE and state parameters.
 */
function generateRandomString(length = 48): string {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(36).padStart(2, "0"))
		.join("")
		.substring(0, length);
}

/**
 * Generate a PKCE S256 code challenge from a code verifier.
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
	const data = new TextEncoder().encode(codeVerifier);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return btoa(String.fromCharCode(...new Uint8Array(digest)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/**
 * Attempt OAuth 2.0 Dynamic Client Registration.
 * Returns the assigned client_id or falls back to a default.
 */
async function registerClient(
	registrationEndpoint: string,
	redirectUri: string,
): Promise<string> {
	const DEFAULT_CLIENT_ID = "mimrai";
	try {
		const response = await fetch(registrationEndpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				client_name: "MIMRAI",
				redirect_uris: [redirectUri],
				grant_types: ["authorization_code"],
				response_types: ["code"],
				token_endpoint_auth_method: "none",
			}),
		});

		if (response.ok) {
			const data = await response.json();
			if (data.client_id) return data.client_id;
		}
	} catch {
		// Ignore and fall back
	}

	return DEFAULT_CLIENT_ID;
}

// ─── Route Helpers ───────────────────────────────────────────────────────────

function getCallbackUrl(): string {
	return `${getApiUrl()}/api/mcp-server-auth/callback`;
}

async function redirectToSettings(
	teamId: string,
	query?: string,
): Promise<string> {
	const team = await getTeamById(teamId);
	const base = `${getAppUrl()}/team/${team.slug}/settings/mcp-servers`;
	return query ? `${base}?${query}` : base;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /:id/authorize
 *
 * Initiates the OAuth flow for an MCP server. Discovers auth metadata,
 * generates PKCE parameters, stores state in the session, and redirects.
 */
app.get("/:id/authorize", async (c) => {
	const { id } = c.req.param();
	const cSession = c.get("session");
	const teamId = c.get("teamId");

	const server = await getMcpServerById({ id, teamId });
	if (!server) {
		return c.json({ error: "MCP server not found" }, 404);
	}

	const config = server.config as McpServerConfig;
	const metadata = await discoverAuthMetadata(config.url);

	const state = generateRandomString();
	const codeVerifier = generateRandomString();
	const codeChallenge = await generateCodeChallenge(codeVerifier);
	const callbackUrl = getCallbackUrl();

	// Attempt dynamic client registration
	const clientId = metadata.registrationEndpoint
		? await registerClient(metadata.registrationEndpoint, callbackUrl)
		: "mimrai";

	// Persist auth state in the user's session
	const authState: McpServerAuthState = {
		mcpServerId: id,
		codeVerifier,
		clientId,
		state,
	};

	await db
		.update(session)
		.set({ metadata: { [MCP_AUTH_SESSION_KEY]: authState } })
		.where(eq(session.id, cSession.id));

	// Build authorization URL with PKCE
	const authUrl = new URL(metadata.authorizationEndpoint);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("client_id", clientId);
	authUrl.searchParams.set("redirect_uri", callbackUrl);
	authUrl.searchParams.set("state", state);
	authUrl.searchParams.set("code_challenge", codeChallenge);
	authUrl.searchParams.set("code_challenge_method", "S256");

	// Request scopes: use configured scopes, or fall back to all supported scopes
	const scopes = config.scopes?.length
		? config.scopes
		: metadata.scopesSupported;
	if (scopes?.length) {
		authUrl.searchParams.set("scope", scopes.join(" "));
	}

	return c.redirect(authUrl.toString());
});

/**
 * GET /callback
 *
 * Handles the OAuth callback. Validates state, exchanges the authorization code
 * for tokens, stores them in an integration user link, and redirects to dashboard.
 */
app.get("/callback", async (c) => {
	const { code, state, error: authError } = c.req.query();
	const cSession = c.get("session");
	const teamId = c.get("teamId");
	const userId = c.get("userId");

	if (authError) {
		const url = await redirectToSettings(
			teamId,
			`error=${encodeURIComponent(authError)}`,
		);
		return c.redirect(url);
	}

	// Retrieve stored auth state from the session
	const [dbSession] = await db
		.select()
		.from(session)
		.where(eq(session.id, cSession.id))
		.limit(1);

	const authState = dbSession?.metadata?.[
		MCP_AUTH_SESSION_KEY
	] as McpServerAuthState | null;

	if (!authState || authState.state !== state) {
		return c.json({ error: "Invalid or expired state parameter" }, 400);
	}

	const { mcpServerId, codeVerifier, clientId } = authState;

	const server = await getMcpServerById({ id: mcpServerId, teamId });
	if (!server) {
		return c.json({ error: "MCP server not found" }, 404);
	}

	const config = server.config as McpServerConfig;
	const metadata = await discoverAuthMetadata(config.url);

	// Exchange authorization code for tokens
	const tokenResponse = await fetch(metadata.tokenEndpoint, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: getCallbackUrl(),
			client_id: clientId,
			code_verifier: codeVerifier,
		}).toString(),
	});

	if (!tokenResponse.ok) {
		const errorBody = await tokenResponse.text();
		console.error("MCP server token exchange failed:", errorBody);
		const url = await redirectToSettings(teamId, "error=token_exchange_failed");
		return c.redirect(url);
	}

	const tokens = (await tokenResponse.json()) as {
		access_token: string;
		refresh_token?: string;
		token_type: string;
		expires_in?: number;
	};

	// Store credentials as an integration user link.
	// Uses the MCP server ID as integrationId so each user authenticates independently.
	await db
		.insert(integrationUserLink)
		.values({
			userId: userId!,
			externalUserId: mcpServerId,
			mcpServerId: mcpServerId,
			externalUserName: server.name,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			config: {
				tokenType: tokens.token_type,
				expiresIn: tokens.expires_in,
				authenticatedAt: new Date().toISOString(),
			},
		})
		.onConflictDoUpdate({
			target: [
				integrationUserLink.mcpServerId,
				integrationUserLink.userId,
				integrationUserLink.externalUserId,
			],
			set: {
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				config: {
					tokenType: tokens.token_type,
					expiresIn: tokens.expires_in,
					authenticatedAt: new Date().toISOString(),
				},
			},
		});

	// Clean up session state
	await db
		.update(session)
		.set({ metadata: { [MCP_AUTH_SESSION_KEY]: null } })
		.where(eq(session.id, cSession.id));

	const url = await redirectToSettings(teamId);
	return c.redirect(url);
});

export { app as mcpServerAuthRouter };
