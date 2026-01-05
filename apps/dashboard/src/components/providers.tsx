"use client";

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
	return (
		<PersistQueryClientProviderWithIDB
			queryClient={queryClient}
			session={session}
		>
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
		</PersistQueryClientProviderWithIDB>
	);
}
