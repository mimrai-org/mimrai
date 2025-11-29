import { Provider as OpenPanelProvider } from "@mimir/events/client";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Runic } from "next/font/google";
import Providers from "@/components/providers";
import "../../index.css";

import { Toaster } from "@ui/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const notoSansRunic = Noto_Sans_Runic({
	variable: "--font-noto-sans-runic",
	subsets: ["latin"],
	weight: ["400"],
});

export const metadata: Metadata = {
	title: "Mimrai - App",
	description: "Mimrai - Your AI Task Management Assistant",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${notoSansRunic.variable} flex min-h-screen flex-col antialiased`}
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
					<OpenPanelProvider />
				</NuqsAdapter>
			</body>
		</html>
	);
}
