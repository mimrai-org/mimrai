import { db } from "@db/index";
import { account, session, users, verification } from "@mimir/db/schema";
import { EmailVerificationEmail } from "@mimir/email/emails/email-verification";
import { ResetPasswordEmail } from "@mimir/email/emails/reset-password";
import { getAppUrl, getEmailFrom } from "@mimir/utils/envs";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { resend } from "./resend";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			session,
			account,
			verification,
			users,
		},
	}),
	trustedOrigins: (process.env.ALLOWED_API_ORIGINS || "").split(","),
	emailVerification: {
		async sendVerificationEmail({ user, url }, request) {
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
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60, // seconds
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
		customSession(async ({ user, session }) => {
			return {
				user: {
					...user,
					teamId: ((user as any).teamId as string) || null,
					teamSlug: ((user as any).teamSlug as string) || null,
				},
				session,
			};
		}),
	],
});
