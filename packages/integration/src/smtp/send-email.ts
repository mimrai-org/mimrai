import {
	getIntegrationByType,
	getLinkedUserByUserId,
} from "@mimir/db/queries/integrations";
import nodemailer from "nodemailer";

interface SendSmtpEmailParams {
	teamId: string;
	userId: string;
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
	cc?: string | string[];
	bcc?: string | string[];
}

export const sendSmtpEmail = async ({
	teamId,
	userId,
	to,
	subject,
	text,
	html,
	cc,
	bcc,
}: SendSmtpEmailParams) => {
	if (!text && !html) {
		throw new Error("Either text or html content is required");
	}

	const integration = await getIntegrationByType({
		type: "smtp",
		teamId,
	});

	if (!integration) {
		throw new Error("SMTP integration is not installed for this team");
	}

	const link = await getLinkedUserByUserId({
		integrationType: "smtp",
		userId,
		teamId,
	});

	if (!link) {
		throw new Error("SMTP integration is not linked for this user");
	}

	const config = integration.config as {
		host: string;
		port: number;
		user: string;
		password: string;
		secure?: boolean;
		fromName?: string;
		fromEmail?: string;
	};

	const fromAddress = config.fromEmail ?? config.user;
	const from = config.fromName
		? `${config.fromName} <${fromAddress}>`
		: fromAddress;

	const transporter = nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure ?? config.port === 465,
		auth: {
			user: config.user,
			pass: config.password,
		},
	});

	const result = await transporter.sendMail({
		from,
		to,
		cc,
		bcc,
		subject,
		text,
		html,
	});

	return {
		messageId: result.messageId,
		accepted: result.accepted,
		rejected: result.rejected,
		response: result.response,
	};
};
