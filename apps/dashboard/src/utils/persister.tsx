"use client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { QueryClient } from "@tanstack/react-query";
import {
	type PersistedClient,
	type Persister,
	PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

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

const persister = createIDBPersister();

export const PersistQueryClientProviderWithIDB = ({
	children,
	queryClient,
}: {
	children: React.ReactNode;
	queryClient: QueryClient;
}) => {
	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister,
			}}
		>
			{children}
		</PersistQueryClientProvider>
	);
};
