import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "export",
	trailingSlash: false,
	devIndicators: false,
	poweredByHeader: false,
	reactStrictMode: true,
	transpilePackages: ["@mimir/ui"],
	images: {
		unoptimized: true,
	},
};

export default nextConfig;
