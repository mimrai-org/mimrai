import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	devIndicators: false,
	poweredByHeader: false,
	reactStrictMode: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		optimizePackageImports: [
			"@mimir/ui",
			"@mimir/integration",
			"@mimir/trpc",
			"lucide-react",
			"react-icons",
			"date-fns",
			"framer-motion",
			"recharts",
			"@dnd-kit/core",
			"@dnd-kit/sortable",
			"usehooks-ts",
		],
	},
	transpilePackages: ["@mimir/integration", "@mimir/trpc", "@mimir/ui"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
			{
				protocol: "http",
				hostname: "(localhost|127.0.0.1)",
			},
		],
	},
};

export default nextConfig;
