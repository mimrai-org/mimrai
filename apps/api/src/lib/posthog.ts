import { PostHog } from "posthog-node";

export const phClient = new PostHog(process.env.POSTHOG_KEY, {
	host: process.env.POSTHOG_HOST,
});
