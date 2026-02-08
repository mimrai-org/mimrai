import { updateMcpServerUserToken } from "@mimir/db/queries/mcp-servers";
import type { McpServerConfig } from "@mimir/db/schema";

/**
 * Buffer in seconds — refresh tokens that expire within this window.
 * This prevents using a token that expires mid-request.
 */
const EXPIRY_BUFFER_SECONDS = 60;

interface TokenInfo {
	accessToken: string;
	refreshToken: string | null;
	config: {
		tokenType?: string;
		expiresIn?: number;
		authenticatedAt?: string;
	} | null;
}

interface OAuthTokenResponse {
	access_token: string;
	refresh_token?: string;
	token_type: string;
	expires_in?: number;
}

/**
 * Discover the OAuth token endpoint from the MCP server's well-known metadata.
 */
async function discoverTokenEndpoint(
	serverUrl: string,
): Promise<string | null> {
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
			if (metadata.token_endpoint) {
				return metadata.token_endpoint as string;
			}
		} catch {
			// Try next URL
		}
	}

	return null;
}

/**
 * Check whether a token has expired (or is about to expire).
 */
export function isTokenExpired(tokenInfo: TokenInfo): boolean {
	const { config } = tokenInfo;
	if (!config?.expiresIn || !config?.authenticatedAt) {
		// No expiration info — assume it's still valid
		return false;
	}

	const authenticatedAt = new Date(config.authenticatedAt).getTime();
	const expiresAtMs =
		authenticatedAt + config.expiresIn * 1000 - EXPIRY_BUFFER_SECONDS * 1000;

	return Date.now() >= expiresAtMs;
}

/**
 * Refresh an expired MCP server OAuth token.
 *
 * 1. Discovers the token endpoint from the MCP server's well-known metadata
 * 2. Exchanges the refresh token for a new access token
 * 3. Persists the new tokens in the database
 * 4. Returns the new access token
 *
 * Returns null if the refresh fails (e.g. no refresh token, discovery fails,
 * or the server rejects the refresh request).
 */
export async function refreshMcpToken({
	userId,
	mcpServerId,
	serverConfig,
	tokenInfo,
}: {
	userId: string;
	mcpServerId: string;
	serverConfig: McpServerConfig;
	tokenInfo: TokenInfo;
}): Promise<string | null> {
	if (!tokenInfo.refreshToken) {
		console.warn(
			`MCP server "${mcpServerId}": token expired but no refresh token available`,
		);
		return null;
	}

	const tokenEndpoint = await discoverTokenEndpoint(serverConfig.url);
	if (!tokenEndpoint) {
		console.warn(
			`MCP server "${mcpServerId}": could not discover token endpoint for refresh`,
		);
		return null;
	}

	try {
		const response = await fetch(tokenEndpoint, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: tokenInfo.refreshToken,
				client_id: "mimrai",
			}).toString(),
		});

		if (!response.ok) {
			const body = await response.text();
			console.error(
				`MCP server "${mcpServerId}": token refresh failed (${response.status}):`,
				body,
			);
			return null;
		}

		const tokens: OAuthTokenResponse = await response.json();

		// Persist updated tokens
		await updateMcpServerUserToken({
			userId,
			mcpServerId,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? tokenInfo.refreshToken,
			config: {
				tokenType: tokens.token_type,
				expiresIn: tokens.expires_in,
				authenticatedAt: new Date().toISOString(),
			},
		});

		return tokens.access_token;
	} catch (error) {
		console.error(`MCP server "${mcpServerId}": token refresh error:`, error);
		return null;
	}
}

/**
 * Resolve a valid access token for an MCP server, refreshing if necessary.
 *
 * Returns the access token string or null if the token is expired and
 * cannot be refreshed.
 */
export async function resolveValidMcpToken({
	userId,
	mcpServerId,
	serverConfig,
	tokenInfo,
}: {
	userId: string;
	mcpServerId: string;
	serverConfig: McpServerConfig;
	tokenInfo: TokenInfo;
}): Promise<string | null> {
	if (!isTokenExpired(tokenInfo)) {
		return tokenInfo.accessToken;
	}

	console.log("Refreshing expired token for MCP server", mcpServerId);
	return refreshMcpToken({ userId, mcpServerId, serverConfig, tokenInfo });
}
