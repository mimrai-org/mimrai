import { Polar } from "@polar-sh/sdk";
import { Stripe } from "stripe";

export const polarClient = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN,
	server: process.env.POLAR_ENVIRONMENT as "production" | "sandbox",
});

export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
