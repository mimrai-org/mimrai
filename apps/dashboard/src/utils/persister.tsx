"use client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { type QueryClient, useIsRestoring } from "@tanstack/react-query";
import {
	type PersistedClient,
	type Persister,
	PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { useState } from "react";
import { Logo } from "@/components/logo";
import type { getSession } from "@/lib/get-session";

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
	return {
		persistClient: async (client: PersistedClient) => {
			await set(idbValidKey, client);
		},
		restoreClient: async () => {
			return await get<PersistedClient>(idbValidKey);
		},
		removeClient: async () => {
			await del(idbValidKey);
		},
	} as Persister;
}

export const PersistQueryClientProviderWithIDB = ({
	children,
	client,
	session,
}: {
	children: React.ReactNode;
	client: QueryClient;
	session: Awaited<ReturnType<typeof getSession>>;
}) => {
	const [persister] = useState(
		createIDBPersister(
			session?.user
				? `reactQuery-${session?.user?.email}:${session?.user?.teamSlug}`
				: "reactQuery-anonymous",
		),
	);

	return (
		<PersistQueryClientProvider
			client={client}
			persistOptions={{
				persister,
			}}
		>
			{children}
		</PersistQueryClientProvider>
	);
};

export const PersisterLoader = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const isRestoring = useIsRestoring();

	if (isRestoring) {
		return (
			<div className="flex h-screen animate-blur-in flex-col items-center justify-center">
				<Logo className="size-8" />
				<span className="text-muted-foreground text-sm">
					Preparing your data...
				</span>
			</div>
		);
	}
	return <>{children}</>;
};
