if (process.env.NODE_ENV === "production") {
	const Sentry = require("@sentry/nextjs");

	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		environment: process.env.NODE_ENV,

		// Lower trace sampling in production to save quota
		tracesSampleRate: 0.1,

		// Enable logs to be sent to Sentry
		enableLogs: true,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,

		replaysSessionSampleRate: 0.1, // 10% of sessions
		replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
	});
}
