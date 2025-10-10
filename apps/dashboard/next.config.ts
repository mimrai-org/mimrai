import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	devIndicators: false,
	poweredByHeader: false,
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	transpilePackages: ["@mimir/integration", "@mimir/api"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

export default nextConfig;
