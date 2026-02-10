import type { Metadata } from "next";
import { Geist, Geist_Mono, Petrona } from "next/font/google";
import Providers from "@/components/providers";
import "../../index.css";

import { Toaster } from "@ui/components/ui/sonner";
import Head from "next/head";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const fontHeader = Petrona({
	variable: "--font-header",
	subsets: ["latin"],
	weight: ["300"],
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
	return (
		<html lang="en" suppressHydrationWarning>
			<Head>
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
			</Head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${fontHeader.variable} flex min-h-screen flex-col antialiased`}
			>
				<NuqsAdapter>
					<Providers>{children}</Providers>
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
