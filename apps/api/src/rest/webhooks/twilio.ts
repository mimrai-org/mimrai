import { OpenAPIHono } from "@hono/zod-openapi";
import { handleWhatsappMessage } from "@mimir/integration/whatsapp";
import { getApiUrl } from "@mimir/utils/envs";
import twilio from "twilio";

const app = new OpenAPIHono();

app.post(async (c) => {
	const body: {
		SmsMessageSid: string;
		SmsSid: string;
		SmsStatus: string;
		ProfileName: string;
		Body: string;
		From: string;
		To: string;
		NumMedia: number;
		[key: `MediaUrl${number}`]: string;
		[key: `MediaContentType${number}`]: string;
	} = (await c.req.parseBody()) as any;

	if (process.env.NODE_ENV === "production") {
		const isValid = twilio.validateRequest(
			process.env.TWILIO_AUTH_TOKEN!,
			c.req.header("x-twilio-signature")!,
			`${getApiUrl()}/webhooks/twilio`,
			body,
		);

		if (!isValid) {
			console.error("Invalid Twilio webhook signature");
			return c.json({ error: "Invalid signature" }, 400);
		}
	}

	console.log("Received Twilio webhook:", body);

	// Handle WhatsApp messages
	if (body.From.startsWith("whatsapp:")) {
		const attachments: {
			url: string;
			contentType: string;
		}[] = [];
		for (let i = 0; i < Number(body.NumMedia); i++) {
			attachments.push({
				url: body[`MediaUrl${i}`],
				contentType: body[`MediaContentType${i}`],
			});
		}

		const response = await handleWhatsappMessage({
			id: body.SmsMessageSid,
			message: body.Body,
			fromNumber: body.From.replace("whatsapp:", ""),
			fromName: body.ProfileName,
			attachments,
		});
		return c.text(response, 200, {
			"Content-Type": "application/xml",
		});
	}

	return c.json({ received: true });
});

export { app as twilioWebhook };
