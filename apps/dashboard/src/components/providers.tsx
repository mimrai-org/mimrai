"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProviderWithIDB } from "@/utils/persister";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<PersistQueryClientProviderWithIDB queryClient={queryClient}>
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
