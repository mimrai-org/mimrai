"use client";

import { useEntitySync } from "@/hooks/use-entity-sync";

/**
 * Provider component that initializes entity sync.
 * Mount once at the team layout level to keep the normalized
 * entity store populated with statuses, members, and projects.
 *
 * Tasks are synced separately via `useTaskSync` / `useEntityTasks`
 * in each view that needs them (since each view has different filters).
 */
export function EntitySyncProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	useEntitySync();
	return <>{children}</>;
}
