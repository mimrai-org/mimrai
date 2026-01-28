import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const getRedis = () => {
	const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
	const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
	return new Redis({
		url: redisUrl!,
		token: redisToken!,
	});
};

/**
 * MCP Rate Limiter
 *
 * Separate rate limiting for MCP endpoints to prevent abuse while
 * allowing legitimate LLM usage patterns.
 */

// Rate limit: 60 requests per minute per client
const mcpRateLimiter = new Ratelimit({
	redis: getRedis(),
	limiter: Ratelimit.slidingWindow(60, "1 m"),
	analytics: true,
	prefix: "mcp-ratelimit",
});

// Stricter rate limit for write operations: 20 per minute
const mcpWriteRateLimiter = new Ratelimit({
	redis: getRedis(),
	limiter: Ratelimit.slidingWindow(20, "1 m"),
	analytics: true,
	prefix: "mcp-write-ratelimit",
});

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

/**
 * Check rate limit for MCP read operations
 */
export async function checkMcpRateLimit(
	clientId: string,
): Promise<RateLimitResult> {
	const result = await mcpRateLimiter.limit(clientId);
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset,
	};
}

/**
 * Check rate limit for MCP write operations (more restrictive)
 */
export async function checkMcpWriteRateLimit(
	clientId: string,
): Promise<RateLimitResult> {
	const result = await mcpWriteRateLimiter.limit(clientId);
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset,
	};
}

/**
 * Determine if operation is a write operation based on tool name
 */
export function isWriteOperation(toolName: string): boolean {
	const writeOperations = [
		"mimrai_create_task",
		"mimrai_update_task",
		"mimrai_delete_task",
	];
	return writeOperations.includes(toolName);
}
