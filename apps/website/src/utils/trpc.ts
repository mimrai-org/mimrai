import type { AppRouter } from "@mimir/api/trpc";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import {
	createTRPCClient,
	httpBatchLink,
	httpBatchStreamLink,
	loggerLink,
	splitLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			console.error("Query Error:", error);
		},
	}),
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		splitLink({
			condition: () => typeof window === "undefined",
			// Server-side
			true: httpBatchLink({
				url: `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc`,
				async fetch(url, options) {
					const headersImport = await import("next/headers");
					const cookieHeader = (await headersImport.headers()).get("cookie");

					// Server-side, embed the request headers
					const response = await fetch(url, {
						...options,
						headers: {
							...options?.headers,
							cookie: cookieHeader || "",
						},
						credentials: "include",
					});

					if (!response.ok) {
						const errorJson = await response.clone().json();
						console.error("tRPC Error:", errorJson);
					}

					return response;
				},
			}),
			// Client-side
			false: httpBatchStreamLink({
				url: `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc`,
				fetch(url, options) {
					return fetch(url, {
						...options,
						credentials: "include",
					});
				},
			}),
		}),
		loggerLink({
			enabled: (opts) =>
				process.env.NODE_ENV === "development" ||
				(opts.direction === "down" && opts.result instanceof Error),
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient: queryClient,
});
