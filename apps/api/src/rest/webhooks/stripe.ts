import { stripeClient } from "@api/lib/payments";
import { OpenAPIHono } from "@hono/zod-openapi";
import { updateTeamPlan } from "@mimir/db/queries/teams";
import { getPlanByProductId } from "@mimir/utils/plans";
import type { Stripe } from "stripe";

const app = new OpenAPIHono();

app.post(async (c) => {
  let event: Stripe.Event;
  const signature = c.req.header("stripe-signature")!;
  const rawBody = await c.req.text();
  try {
    event = await stripeClient.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err}`);
    return c.json({ error: "Webhook signature verification failed" }, 400);
  }

  switch (event.type) {
    case "customer.subscription.created": {
      await updateTeamPlan({
        customerId: event.data.object.customer as string,
        plan: getPlanByProductId(
          event.data.object.items.data[0].price.product as string
        ),
        canceledAt: null,
      });
      break;
    }
    case "customer.subscription.paused": {
      await updateTeamPlan({
        customerId: event.data.object.customer as string,
        canceledAt: new Date(),
      });
      break;
    }
    case "customer.subscription.deleted": {
      await updateTeamPlan({
        customerId: event.data.object.customer as string,
        canceledAt: new Date(),
        plan: null,
      });
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      await updateTeamPlan({
        customerId: event.data.object.customer as string,
        plan: getPlanByProductId(
          subscription.items.data[0].price.product as string
        ),
        canceledAt: null,
      });
      break;
    }
    case "customer.subscription.resumed": {
      const subscription = event.data.object as Stripe.Subscription;

      await updateTeamPlan({
        customerId: event.data.object.customer as string,
        plan: getPlanByProductId(
          subscription.items.data[0].price.product as string
        ),
        canceledAt: null,
      });
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  return c.json({ received: true });
});

export { app as stripeWebhook };
