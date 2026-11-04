"use client";

import { Toaster } from "@mimir/ui/sonner";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			forcedTheme="dark"
			disableTransitionOnChange
		>
			{children}
			<Toaster />
		</ThemeProvider>
	);
}
