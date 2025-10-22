import { init } from "@sentry/node";

export const sentry = init({
  dsn: process.env.SENTRY_DSN!,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV,
  // enabled: process.env.NODE_ENV === "production",
});
