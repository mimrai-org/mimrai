"use client";

import type { RealtimeEvents } from "@mimir/realtime";
import { createRealtime } from "@upstash/realtime/client";
import { useMemo } from "react";
import { useUser } from "@/components/user-provider";

export const { useRealtime } = createRealtime<RealtimeEvents>();

export const useChannelName = (...keys: (string | undefined | string[])[]) => {
	const user = useUser();
	const teamId = user?.team.id;

	const channels = useMemo(() => {
		// Generate all combinations of keys if any key is an array
		const expandedKeys: string[][] = keys.map((key) =>
			Array.isArray(key) ? key : [key ?? ""],
		);

		const combinations: string[][] = [[]];

		for (const keyOptions of expandedKeys) {
			const newCombinations: string[][] = [];
			for (const combination of combinations) {
				for (const option of keyOptions) {
					newCombinations.push([...combination, option]);
				}
			}
			combinations.splice(0, combinations.length, ...newCombinations);
		}

		// Create channel names from combinations
		return combinations.map(
			(combination) =>
				`team:${teamId}:${combination
					.filter((k) => k) // remove empty strings
					.join(":")}`,
		);
	}, [teamId, keys]);

	return channels;
};
