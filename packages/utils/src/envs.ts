export function getEmailFrom() {
	return "Mimir <mimir@grupo-titanio.com>";
}

export function getAppUrl() {
	if (
		process.env.VERCEL_ENV === "production" ||
		process.env.NODE_ENV === "production"
	) {
		return "https://app.mimrai.com";
	}

	if (process.env.VERCEL_ENV === "preview") {
		return `https://${process.env.VERCEL_URL}`;
	}

	return "http://localhost:3000";
}

export function getEmailUrl() {
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:3000";
	}

	return "https://app.mimrai.com";
}

export function getWebsiteUrl() {
	if (
		process.env.VERCEL_ENV === "production" ||
		process.env.NODE_ENV === "production"
	) {
		return "https://mimrai.com";
	}

	if (process.env.VERCEL_ENV === "preview") {
		return `https://${process.env.VERCEL_URL}`;
	}

	return "http://localhost:3001";
}

export function getCdnUrl() {
	return "https://cdn.mimrai.com";
}

export function getApiUrl() {
	if (process.env.NEXT_PUBLIC_SERVER_URL) {
		return process.env.NEXT_PUBLIC_SERVER_URL;
	}

	if (
		process.env.VERCEL_ENV === "production" ||
		process.env.NODE_ENV === "production"
	) {
		return "https://api.mimrai.com";
	}

	return "http://localhost:3003";
}
