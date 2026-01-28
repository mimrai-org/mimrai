import { db } from "@mimir/db/client";
import {
	account,
	apikey,
	session,
	users,
	verification,
} from "@mimir/db/schema";
import { EmailVerificationEmail } from "@mimir/email/emails/email-verification";
import { ResetPasswordEmail } from "@mimir/email/emails/reset-password";
import { op } from "@mimir/events/server";
import { getAppUrl, getEmailFrom } from "@mimir/utils/envs";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
	apiKey,
	createAuthMiddleware,
	customSession,
} from "better-auth/plugins";
import { resend } from "./resend";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			session,
			account,
			verification,
			users,
			apikey,
		},
	}),
	trustedOrigins: (process.env.ALLOWED_API_ORIGINS || "").split(","),
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith("/sign-in")) {
				const session = ctx.context.newSession;
				if (session) {
					op.identify({
						profileId: session.user.id,
						email: session.user.email,
						firstName: session.user.name,
						avatar: session.user.image,
					});
				}
			}
		}),
	},
	emailVerification: {
		async sendVerificationEmail({ user, url }, _request) {
			const parsedUrl = new URL(url);
			parsedUrl.searchParams.set("callbackURL", `${getAppUrl()}/redirect`);
			await resend.emails.send({
				from: getEmailFrom(),
				to: user.email!,
				subject: "Verify your email address",
				react: EmailVerificationEmail({
					userName: user.name,
					url: parsedUrl.toString(),
				}),
			});
		},
		autoSignInAfterVerification: true,
		sendOnSignUp: true,
		sendOnSignIn: true,
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, token }) => {
			await resend.emails.send({
				from: getEmailFrom(),
				to: user.email!,
				subject: "Reset your password",
				react: ResetPasswordEmail({
					email: user.email!,
					token,
				}),
			});
		},
	},
	session: {
		cookieCache: {
			enabled: true,
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID || "",
			clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
		},
		twitter: {
			clientId: process.env.X_CLIENT_ID || "",
			clientSecret: process.env.X_CLIENT_SECRET || "",
		},
	},
	user: {
		modelName: "users",
		additionalFields: {
			locale: {
				type: "string",
				required: false,
			},
			teamId: {
				type: "string",
				required: false,
				returned: true,
				input: false,
				fieldName: "teamId",
			},
			teamSlug: {
				type: "string",
				required: false,
				returned: true,
				input: false,
				fieldName: "teamSlug",
			},
		},
	},
	advanced: {
		useSecureCookies: true,
		crossSubDomainCookies: {
			enabled: true,
			domain: process.env.BETTER_AUTH_DOMAIN || "localhost",
		},
	},
	plugins: [
		apiKey({
			// API key configuration for MCP authentication
			defaultPrefix: "mimir_",
			enableMetadata: true,
			// Enable session creation from API keys for MCP requests
			enableSessionForAPIKeys: true,
			// Default rate limiting: 1000 requests per day
			rateLimit: {
				enabled: true,
				timeWindow: 1000 * 60 * 60 * 24, // 1 day
				maxRequests: 1000,
			},
			// Custom permissions for MCP scopes
			permissions: {
				defaultPermissions: {
					tasks: ["read", "write"],
					projects: ["read", "write"],
					milestones: ["read", "write"],
					labels: ["read", "write"],
				},
			},
		}),
		customSession(async ({ user, session }) => {
			const userWithTeam = user as unknown as {
				teamId?: string;
				teamSlug?: string;
			};
			return {
				user: {
					...user,
					teamId: userWithTeam.teamId || null,
					teamSlug: userWithTeam.teamSlug || null,
				},
				session,
			};
		}),
	],
});
