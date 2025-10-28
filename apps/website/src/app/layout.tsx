import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Runic } from "next/font/google";
import Providers from "@/components/providers";
import "../../index.css";
import { Provider as OpenPanelProvider } from "@mimir/events/client";

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
	title: "Mimrai",
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
				className={`${geistSans.variable} ${geistMono.variable} ${notoSansRunic.variable} flex min-h-screen flex-col antialiased invert`}
			>
				<OpenPanelProvider />
				<Providers>
					<main>{children}</main>
				</Providers>
			</body>
		</html>
	);
}
