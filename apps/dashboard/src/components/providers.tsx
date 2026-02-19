"use client";

import { getApiUrl } from "@mimir/utils/envs";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { RealtimeProvider } from "@upstash/realtime/client";
import { useState } from "react";
import type { getSession } from "@/lib/get-session";
import {
	PersisterLoader,
	PersistQueryClientProviderWithIDB,
} from "@/utils/persister";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";

export default function Providers({
	children,
	session,
}: {
	children: React.ReactNode;
	session: Awaited<ReturnType<typeof getSession>>;
}) {
	const [localQueryClient] = useState(() => queryClient);

	return (
		<RealtimeProvider
			api={{
				url: `${getApiUrl()}/api/realtime`,
				withCredentials: true,
			}}
		>
			<QueryClientProvider client={localQueryClient}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<PersisterLoader>{children}</PersisterLoader>
				</ThemeProvider>
				{/* <CleanTasksFilters /> */}
				{/* <ReactQueryDevtools /> */}
			</QueryClientProvider>
		</RealtimeProvider>
	);
}
