"use client";

import { Toaster } from "@mimir/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<NuqsAdapter>
				<QueryClientProvider client={queryClient}>
					{children}
					{/* <ReactQueryDevtools /> */}
				</QueryClientProvider>
			</NuqsAdapter>
			<Toaster />
		</ThemeProvider>
	);
}
