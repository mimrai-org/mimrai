import { RedisCache } from "./redis-client";

// Redis-based cache for users shared across all server instances
const cache = new RedisCache("team", 10 * 60); // 5 minutes TTL

export const teamCache = {
	get: (key: string): Promise<any | undefined> => cache.get(key),
	set: (key: string, value: any): Promise<void> => cache.set(key, value),
	delete: (key: string): Promise<void> => cache.delete(key),
};
