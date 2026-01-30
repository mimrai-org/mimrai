import {
	type EventData,
	type EventPath,
	type InferRealtimeEvents,
	Realtime,
} from "@upstash/realtime";
import { schema } from "./events";
import { redis } from "./redis-client";

const opts = { schema, redis };
// @ts-expect-error upstash realtime types are broken
export const realtime = new Realtime(opts);
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;

// create a helper function to subscribe to events as an async iterator
export async function* subscribeToEvents<
	// @ts-expect-error upstash realtime types are broken
	T extends EventPath<typeof opts>,
	// @ts-expect-error upstash realtime types are broken
	R extends EventData<typeof opts, T>,
>(opts: {
	events: T[];
	channel?: string;
	signal?: AbortSignal;
}): AsyncGenerator<R, void, unknown> {
	const { events, channel, signal } = opts;
	const elements: R[] = [];
	const realtimeChannel = channel ? realtime.channel(channel) : realtime;
	const unsubscribe = await realtimeChannel.subscribe({
		events: events as never[],

		onData: (data) => {
			console.log("Event data received:", data);
			// @ts-expect-error upstash realtime types are broken
			elements.push(data.data as R);
		},
	});

	if (signal) {
		signal.addEventListener("abort", () => {
			unsubscribe();
		});
	}

	while (true) {
		if (elements.length === 0) {
			// wait for new data
			await new Promise((resolve) => setTimeout(resolve, 100));
			continue;
		}
		yield elements.shift()!;
	}
}

export const getChannelName = (
	teamId: string,
	...keys: (string | undefined)[]
) => {
	return `team:${teamId}:${keys.filter(Boolean).sort().join(":")}`;
};
