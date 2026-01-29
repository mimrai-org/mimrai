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
>(
	events: T[],
	opts?: {
		signal?: AbortSignal;
	},
): AsyncGenerator<R, void, unknown> {
	const elements: R[] = [];
	const unsubscribe = await realtime.subscribe({
		events: events as never[],
		onData: (data) => {
			console.log("Event data received:", data);
			// @ts-expect-error upstash realtime types are broken
			elements.push(data.data as R);
		},
	});

	console.log("Subscribed to events:", events);

	if (opts?.signal) {
		opts.signal.addEventListener("abort", () => {
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
