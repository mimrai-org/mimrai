import { OpenAPIHono } from "@hono/zod-openapi";
import { getPlanByProductId } from "@mimir/utils/plans";
import { validateEvent } from "@polar-sh/sdk/webhooks.js";
import { updateTeamPlan } from "@/db/queries/teams";

const app = new OpenAPIHono();

app.post(async (c) => {
	const event = validateEvent(
		await c.req.text(),
		c.req.header(),
		process.env.POLAR_WEBHOOK_SECRET!,
	);

	switch (event.type) {
		case "subscription.active": {
			await updateTeamPlan({
				teamId: event.data.metadata.teamId as string,
				email: event.data.customer.email as string,
				plan: getPlanByProductId(event.data.productId),
				canceledAt: null,
			});
			break;
		}
		case "subscription.canceled": {
			await updateTeamPlan({
				teamId: event.data.metadata.teamId as string,
				canceledAt: new Date(),
				email: event.data.customer.email as string,
			});
			break;
		}
		case "subscription.revoked": {
			await updateTeamPlan({
				teamId: event.data.metadata.teamId as string,
				canceledAt: new Date(),
				email: event.data.customer.email as string,
				plan: null,
			});
			break;
		}
		default:
			console.log(`Unhandled event type: ${event.type}`);
	}
	return c.json({ received: true });
});

export { app as polarWebhook };
