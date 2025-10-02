import type { AppRouter } from "@mimir/server/trpc";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			console.error("Query Error:", error);
			// toast.error(error.message, {
			// 	action: {
			// 		label: "retry",
			// 		onClick: () => {
			// 			queryClient.invalidateQueries();
			// 		},
			// 	},
			// });
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
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient: queryClient,
});
