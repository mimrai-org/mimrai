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
  } = await c.req.parseBody();
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    c.req.header("x-twilio-signature")!,
    `${getApiUrl()}/webhooks/twilio`,
    body
  );

  if (!isValid) {
    console.error("Invalid Twilio webhook signature");
    return c.json({ error: "Invalid signature" }, 400);
  }

  // Handle WhatsApp messages
  if (body.From.startsWith("whatsapp:")) {
    const response = await handleWhatsappMessage({
      id: body.SmsMessageSid,
      message: body.Body,
      fromNumber: body.From.replace("whatsapp:", ""),
      fromName: body.ProfileName,
    });
    return c.text(response, 200, {
      "Content-Type": "application/xml",
    });
  }

  return c.json({ received: true });
});

export { app as twilioWebhook };
