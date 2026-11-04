import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Runic } from "next/font/google";
import Providers from "@/components/providers";
import "../../index.css";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { SITE_URL } from "@/lib/links";

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
	metadataBase: new URL(SITE_URL),
	title: {
		default: "MIMRAI Tasks - Open-source task management template",
		template: "%s | MIMRAI Tasks",
	},
	description:
		"An open-source, AI-assisted task management app you can fork and self-host. Next.js, Hono, tRPC, Drizzle and Better Auth, by MIMRAI.",
	keywords: [
		"task management",
		"project management",
		"productivity",
		"open source",
		"AI assistant",
		"minimalist",
		"template",
		"self-hosted",
	],
	authors: [{ name: "MIMRAI", url: "https://mimrai.com" }],
	creator: "MIMRAI",
	publisher: "MIMRAI",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "/",
		title: "MIMRAI Tasks - Open-source task management template",
		description:
			"An open-source, AI-assisted task management app you can fork and self-host.",
		siteName: "MIMRAI Tasks",
	},
	twitter: {
		card: "summary_large_image",
		title: "MIMRAI Tasks - Open-source task management template",
		description:
			"An open-source, AI-assisted task management app you can fork and self-host.",
	},
	alternates: {
		canonical: "/",
	},
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
				<Providers>
					<Navbar />
					<main>{children}</main>
					<Footer />
				</Providers>
			</body>
		</html>
	);
}
