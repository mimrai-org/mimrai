import * as Sentry from "@sentry/node";

export const sentry = Sentry.init({
  dsn: process.env.SENTRY_DSN!,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
  enabled: process.env.NODE_ENV === "production",
});
