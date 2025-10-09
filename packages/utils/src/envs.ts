export function getEmailFrom() {
	return "Mimir <mimir@grupo-titanio.com>";
}

export function getAppUrl() {
	if (
		process.env.VERCEL_ENV === "production" ||
		process.env.NODE_ENV === "production"
	) {
		return "https://www.start-mimir.app";
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

	return "https://www.start-mimir.app";
}

export function getWebsiteUrl() {
	if (
		process.env.VERCEL_ENV === "production" ||
		process.env.NODE_ENV === "production"
	) {
		return "https://mimir.ai";
	}

	if (process.env.VERCEL_ENV === "preview") {
		return `https://${process.env.VERCEL_URL}`;
	}

	return "http://localhost:3001";
}

export function getCdnUrl() {
	return "https://cdn.mimir.ai";
}
