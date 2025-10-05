import type { AppRouter } from "@mimir/api/trpc";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			console.error("Query Error:", error);
		},
	}),
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc`,
			// transformer: superjson,
			async fetch(url, options) {
				if (typeof window === "undefined") {
					const headersImport = await import("next/headers");
					const currentHeaders = await headersImport.headers();

					// Server-side, embed the request headers
					return fetch(url, {
						...options,
						headers: {
							...Object.fromEntries(currentHeaders.entries()),
						},
					});
				}

				// Client-side, include cookies
				const response = await fetch(url, {
					...options,
					credentials: "include",
				});

				return response;
			},
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
