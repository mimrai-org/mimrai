"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
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
