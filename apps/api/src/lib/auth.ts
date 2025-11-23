import { db } from "@db/index";
import {
	account,
	session,
	userInvites,
	users,
	verification,
	waitlist,
} from "@mimir/db/schema";
import { EmailVerificationEmail } from "@mimir/email/emails/email-verification";
import { ResetPasswordEmail } from "@mimir/email/emails/reset-password";
import { getAppUrl, getEmailFrom, getWebsiteUrl } from "@mimir/utils/envs";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
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
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path !== "/sign-up/email") {
				return;
			}

			// Bypass waitlist check in development
			if (process.env.NODE_ENV === "development") {
				return;
			}

			const [waitlistEntry] = await db
				.select()
				.from(waitlist)
				.where(eq(waitlist.email, ctx.body.email))
				.limit(1);

			const [invitationEntry] = await db
				.select()
				.from(userInvites)
				.where(eq(userInvites.email, ctx.body.email))
				.limit(1);

			// If the user is not on the waitlist or not authorized, and has no invitation, block sign up
			if (!waitlistEntry || !waitlistEntry.authorized) {
				if (!invitationEntry) {
					throw new APIError(
						403,
						"Sign up is currently by invitation only. Please join our waitlist at " +
							getWebsiteUrl(),
					);
				}
			}
		}),
	},
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
		},
	},
	advanced: {
		useSecureCookies: process.env.NODE_ENV !== "development",
		crossSubDomainCookies: {
			enabled: true,
			domain: process.env.BETTER_AUTH_DOMAIN || "localhost",
		},
	},
	plugins: [],
});
