import type { activities } from "@mimir/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import type { CreateEmailOptions } from "resend";

export interface TeamContext {
	id: string;
	name: string;
}

export interface CreateNotificationInput {
	title: string;
	message: string;
	type: "customer" | "team" | "owners";
	additionalRecipients?: string[];
	url?: string;
}

export interface NotificationHandler {
	email?: {
		template: string;
		subject: string;
		from?: string;
		replyTo?: string;
	};
	createNotification: (
		data: InferSelectModel<typeof activities>,
		user: UserData,
	) => CreateNotificationInput;
	createWhatsappNotification?: (
		data: InferSelectModel<typeof activities>,
		user: UserData,
	) => {
		message: string;
		type: "customer" | "team" | "owners";
		additionalRecipients?: string[];
	};
	createEmail?: (
		data: InferSelectModel<typeof activities>,
		user: UserData,
		team: TeamContext,
	) => Partial<CreateEmailOptions> & {
		data: Record<string, any>;
		template?: string;
		additionalRecipients?: string[];
		emailType: "customer" | "team" | "owners"; // Explicit: customer emails go to external recipients, team emails go to all team members, owners emails go to team owners only
	};
}

export interface UserData {
	id: string;
	name?: string;
	email: string;
	locale?: string;
	teamId: string;
}

// Combine template data with all Resend options using intersection type
export type EmailInput = {
	template?: string;
	user: UserData;
	data: Record<string, any>;
} & Partial<CreateEmailOptions>;

// Use intersection type to combine our options with Resend's CreateEmailOptions
export type NotificationOptions = {
	priority?: number;
	sendEmail?: boolean;
} & Partial<CreateEmailOptions>;

export interface NotificationResult {
	type: string;
	activities: number;
	emails: {
		sent: number;
		skipped: number;
		failed?: number;
	};
}
