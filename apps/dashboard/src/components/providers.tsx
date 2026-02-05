"use client";

import { getApiUrl } from "@mimir/utils/envs";
import { QueryClientProvider } from "@tanstack/react-query";
import { RealtimeProvider } from "@upstash/realtime/client";
import { useState } from "react";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
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
					{children}
				</ThemeProvider>
				{/* <CleanTasksFilters /> */}
				{/* <ReactQueryDevtools /> */}
			</QueryClientProvider>
		</RealtimeProvider>
	);
}
