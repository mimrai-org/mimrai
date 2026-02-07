import { RedisCache } from "./redis-client";

// Redis-based cache for system user lookups (agent detection)
// Uses a long TTL since isSystemUser rarely changes
const cache = new RedisCache("system-user", 60 * 60); // 1 hour TTL

export const systemUserCache = {
	get: (userId: string): Promise<boolean | undefined> =>
		cache.get<boolean>(userId),
	set: (userId: string, value: boolean): Promise<void> =>
		cache.set(userId, value),
	delete: (userId: string): Promise<void> => cache.delete(userId),
};
