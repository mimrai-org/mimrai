import { stripeClient } from "@api/lib/payments";
import { OpenAPIHono } from "@hono/zod-openapi";
import { updateSubscriptionUsage } from "@mimir/billing";
import {
	recordCreditAdjustment,
	recordCreditPurchase,
	recordCreditRefund,
} from "@mimir/db/queries/credits";
import { updateTeamPlan } from "@mimir/db/queries/teams";
import { getPlanByPriceId } from "@mimir/utils/plans";
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
			process.env.STRIPE_WEBHOOK_SECRET!,
		);
	} catch (err) {
		console.error(`Webhook signature verification failed: ${err}`);
		return c.json({ error: "Webhook signature verification failed" }, 400);
	}

	switch (event.type) {
		case "payment_intent.succeeded": {
			const paymentIntent = event.data.object as Stripe.PaymentIntent;

			console.log(paymentIntent);

			if (paymentIntent.metadata?.billingType !== "credits_adjustment") {
				break;
			}

			const teamId = paymentIntent.metadata?.teamId;
			if (!teamId) {
				break;
			}

			const adjustmentFromMetadata = paymentIntent.metadata?.adjustmentCents
				? Number.parseInt(paymentIntent.metadata.adjustmentCents, 10)
				: undefined;
			const amountCents =
				adjustmentFromMetadata ?? paymentIntent.amount_received ?? 0;

			if (amountCents === 0) {
				break;
			}

			await recordCreditAdjustment({
				teamId,
				amountCents,
				stripePaymentIntentId: paymentIntent.id,
				stripeEventId: event.id,
				metadata: {
					reason: paymentIntent.metadata?.reason,
				},
			});
			break;
		}
		case "checkout.session.completed": {
			const session = event.data.object as Stripe.Checkout.Session;

			if (session.metadata?.billingType !== "credits") {
				break;
			}

			const paymentIntentId =
				typeof session.payment_intent === "string"
					? session.payment_intent
					: session.payment_intent?.id;

			const teamId = session.metadata?.teamId;
			const metadataAmount = session.metadata?.amountCents
				? Number.parseInt(session.metadata.amountCents, 10)
				: undefined;

			if (!paymentIntentId || !teamId) {
				break;
			}

			const amountCents =
				metadataAmount ?? session.amount_total ?? session.amount_subtotal ?? 0;

			if (amountCents <= 0) {
				break;
			}

			await recordCreditPurchase({
				teamId,
				amountCents,
				stripePaymentIntentId: paymentIntentId,
				stripeEventId: event.id,
				metadata: {
					checkoutSessionId: session.id,
				},
			});
			break;
		}
		case "charge.refunded": {
			const charge = event.data.object as Stripe.Charge;

			const paymentIntentId =
				typeof charge.payment_intent === "string"
					? charge.payment_intent
					: charge.payment_intent?.id;

			let teamId = charge.metadata?.teamId;
			if (!teamId && paymentIntentId) {
				const paymentIntent =
					await stripeClient.paymentIntents.retrieve(paymentIntentId);
				teamId = paymentIntent.metadata?.teamId;
			}

			const amountRefunded = charge.amount_refunded ?? 0;

			if (!teamId || amountRefunded <= 0) {
				break;
			}

			await recordCreditRefund({
				teamId,
				amountCents: amountRefunded,
				stripePaymentIntentId: paymentIntentId,
				stripeEventId: event.id,
				metadata: {
					chargeId: charge.id,
				},
			});
			break;
		}
		case "customer.subscription.resumed":
		case "customer.subscription.created": {
			await updateTeamPlan({
				customerId: event.data.object.customer as string,
				plan: getPlanByPriceId(
					event.data.object.items.data[0].price.id as string,
				).slug,
				subscriptionId: event.data.object.id,
				canceledAt: null,
			});
			// update subscription users usage
			await updateSubscriptionUsage({
				teamId: event.data.object.metadata.teamId,
				type: "users",
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
				plan: getPlanByPriceId(subscription.items.data[0].price.id as string)
					.slug,
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
