"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { getSession } from "@/lib/get-session";
import { PersistQueryClientProviderWithIDB } from "@/utils/persister";
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
	);
}
