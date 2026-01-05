import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import "../../index.css";

import { Toaster } from "@ui/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getSession } from "@/lib/get-session";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Mimrai - App",
	description: "Mimrai - Your AI Task Management Assistant",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getSession();

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
			>
				<NuqsAdapter>
					<Providers session={session}>{children}</Providers>
					<Toaster
						toastOptions={{
							classNames: {
								title: "text-xs!",
								description: "text-xs!",
							},
						}}
					/>
				</NuqsAdapter>
			</body>
		</html>
	);
}
