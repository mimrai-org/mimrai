import { PLANS, POLAR_ENVIRONMENT } from "@mimir/utils/plans";
import { checkout, polar, portal, usage } from "@polar-sh/better-auth";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { users } from "@/db/schema/schemas";
import { db } from "../db";
import * as schema from "../db/schema/auth";
import { polarClient } from "./payments";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			...schema,
			users,
		},
	}),
	trustedOrigins: (process.env.ALLOWED_API_ORIGINS || "").split(","),
	emailAndPassword: {
		enabled: true,
	},
	user: {
		modelName: "users",
		additionalFields: {
			teamId: {
				type: "string",
				required: false,
				returned: true,
				input: false,
				fieldName: "teamId",
			},
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
	plugins: [
		polar({
			client: polarClient,
			createCustomerOnSignUp: false,
			enableCustomerPortal: true,
			use: [
				checkout({
					products: Object.values(
						PLANS[POLAR_ENVIRONMENT as keyof typeof PLANS]!,
					).map((plan) => ({
						productId: plan.id,
						slug: plan.key,
					})),
					successUrl: process.env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
				portal(),
				usage(),
			],
		}),
	],
});
