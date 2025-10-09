import { db } from "@db/index";
import { account, session, users, verification } from "@mimir/db/schema";
import { EmailVerificationEmail } from "@mimir/email/emails/email-verification";
import { getAppUrl, getEmailFrom, getWebsiteUrl } from "@mimir/utils/envs";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
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
		useSecureCookies: true,
		crossSubDomainCookies: {
			enabled: true,
			domain: process.env.BETTER_AUTH_DOMAIN || "localhost",
		},
	},
	plugins: [],
});
