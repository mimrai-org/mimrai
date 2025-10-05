import { RedisCache } from "./redis-client";

// Use undefined for defaultTTL to skip setting expiration
const cache = new RedisCache("integrations", undefined);

type Event =
	| {
			type: "stop";
	  }
	| {
			type: "restart";
			config?: Record<string, any>;
	  }
	| {
			type: "start";
	  };

export const integrationsCache = {
	listenStart: async (callback: (integrationId: string) => void) => {
		const subscriber = await cache.subscribe("runner:start", (message) => {
			const event = JSON.parse(message) as { integrationId: string };
			callback(event.integrationId);
		});
		return async () => {
			await subscriber?.unsubscribe("runner:start");
			await subscriber?.quit();
		};
	},

	requestStart: async (integrationId: string) => {
		await cache.publish("runner:start", JSON.stringify({ integrationId }));
	},

	registerRunner: async (
		integrationId: string,
		callback: (event: Event) => Promise<void>,
	) => {
		const subscriber = await cache.subscribe(
			`runner:${integrationId}`,
			async (message) => {
				// Handle runner events
				await callback(JSON.parse(message) as Event);
			},
		);

		return async () => {
			// Unsubscribe from events
			await subscriber?.unsubscribe(`runner:${integrationId}`);
			await subscriber?.quit();
		};
	},
	isRunning: async (integrationId: string): Promise<boolean> => {
		const subscriptionsCount = await cache.getSubscribersCount(
			`runner:${integrationId}`,
		);
		return subscriptionsCount > 0;
	},

	publish: async (integrationId: string, event: Event) => {
		await cache.publish(`runner:${integrationId}`, JSON.stringify(event));
	},
};
