import { stripeClient } from "@api/lib/payments";
import { createCheckoutSchema } from "@api/schemas/billing";
import { protectedProcedure, router } from "@api/trpc/init";
import { buildSubscriptionItems } from "@mimir/billing";
import { getTeamById, updateTeamPlan } from "@mimir/db/queries/teams";
import { getAppUrl } from "@mimir/utils/envs";
import { getPlanBySlug, getPlans, type PlanSlug } from "@mimir/utils/plans";

export const billingRouter = router({
	subscription: protectedProcedure.query(async ({ ctx }) => {
		const team = await getTeamById(ctx.user.teamId!);
		const result = await stripeClient.subscriptions.list({
			customer: team!.customerId!,
			expand: [],
			limit: 1,
		});
		const subscription = result.data[0];
		const plan = getPlanBySlug(team!.plan!);

		return {
			trialEnd: subscription?.trial_end,
			status: subscription?.status,
			planName: plan?.name,
			planSlug: team!.plan!,
		};
	}),

	upcomingInvoice: protectedProcedure
		.meta({
			scopes: ["team:write"],
		})
		.query(async ({ ctx }) => {
			const team = await getTeamById(ctx.user.teamId!);
			try {
				if (!team?.subscriptionId) {
					return null;
				}
				const subscription = await stripeClient.subscriptions.retrieve(
					team!.subscriptionId!,
				);
				if (
					subscription.status === "trialing" ||
					subscription.status === "canceled"
				) {
					// Still in trial period, no upcoming invoice
					return null;
				}
				const result = await stripeClient.invoices.createPreview({
					customer: team!.customerId!,
					subscription: team!.subscriptionId!,
					subscription_details: {
						items: subscription.items.data.map((item) => ({
							id: item.id,
							quantity: item.quantity,
						})),
					},
				});
				return {
					amountDue: result.amount_due,
				};
			} catch (e) {
				console.error("Error fetching upcoming invoice:", e);
				return null;
			}
		}),

	plans: protectedProcedure.query(async () => {
		return getPlans();
	}),

	checkout: protectedProcedure
		.meta({
			scopes: ["team:write"],
		})
		.input(createCheckoutSchema)
		.mutation(async ({ ctx, input }) => {
			const team = await getTeamById(ctx.user.teamId!);
			const result = await stripeClient.subscriptions.list({
				customer: team!.customerId!,
				expand: [],
				limit: 1,
			});
			const subscription = result.data[0];

			const items = await buildSubscriptionItems({
				planSlug: input.planSlug as PlanSlug,
				teamId: team!.id,
				recurringInterval: input.recurringInterval,
			});
			const paymentMethodsResponse = await stripeClient.paymentMethods.list({
				customer: team.customerId,
			});
			const hasPaymentMethod = paymentMethodsResponse.data.length > 0;

			// If subscription exists, we are upgrading/downgrading
			if (subscription) {
				if (!hasPaymentMethod) {
					// create a checkout session to collect payment method first and set as default
					const session = await stripeClient.checkout.sessions.create({
						payment_method_types: ["card"],
						mode: "setup",
						customer: team!.customerId!,
						success_url: `${getAppUrl()}/team/${team.slug}/settings/billing?checkout=success`,
						cancel_url: `${getAppUrl()}/team/${team.slug}/settings/billing?checkout=cancel`,
					});

					return {
						isUpgradeDowngrade: false,
						url: session.url!,
					};
				}

				const itemsToDelete = subscription.items.data;

				// Update the existing subscription
				await stripeClient.subscriptions.update(subscription.id, {
					cancel_at_period_end: false,
					items: [
						// Delete old items
						...itemsToDelete.map((item) => ({
							id: item.id,
							deleted: true,
						})),
						// Add new items
						...items.map((item) => ({
							price: item.price,
							quantity: item.quantity,
						})),
					],
					billing_cycle_anchor: "now",
				});

				await updateTeamPlan({
					customerId: team!.customerId!,
					plan: input.planSlug as PlanSlug,
					subscriptionId: subscription.id,
					canceledAt: null,
				});

				return {
					isUpgradeDowngrade: true,
					url: `${getAppUrl()}/team/${team.slug}/settings/billing`,
				};
			}

			const session = await stripeClient.checkout.sessions.create({
				mode: "subscription",
				customer: team!.customerId!,
				payment_method_collection: "if_required",
				saved_payment_method_options: {
					payment_method_save: "enabled",
					allow_redisplay_filters: ["always"],
				},
				line_items: items.map((item) => ({
					price: item.price,
					quantity: item.quantity,
				})),
				subscription_data: {
					metadata: {
						planName: input.planSlug,
						teamId: team!.id,
					},
				},
				success_url: `${getAppUrl()}/team/${team.slug}/settings/billing?checkout=success`,
				cancel_url: `${getAppUrl()}/team/${team.slug}/settings/billing?checkout=cancel`,
			});

			return {
				isUpgradeDowngrade: false,
				url: session.url!,
			};
		}),

	portal: protectedProcedure
		.meta({
			scopes: ["team:write"],
		})
		.mutation(async ({ ctx }) => {
			const team = await getTeamById(ctx.user.teamId!);

			const result = await stripeClient.billingPortal.sessions.create({
				customer: team!.customerId!,
				return_url: `${getAppUrl()}/team/${team.slug}/settings/billing`,
			});

			return result;
		}),
});
