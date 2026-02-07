import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	poweredByHeader: false,
	reactStrictMode: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		optimizePackageImports: [
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
	transpilePackages: ["@mimir/ui"],
	images: {
		dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
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
