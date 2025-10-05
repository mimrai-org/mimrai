import { getAppUrl } from "@mimir/utils/envs";
import { getTeamById } from "@/db/queries/teams";
import { polarClient, stripeClient } from "@/lib/payments";
import { createCheckoutSchema } from "@/schemas/billing";
import { protectedProcedure, router } from "@/trpc/init";

export const billingRouter = router({
	subscription: protectedProcedure.query(async ({ ctx }) => {
		const team = await getTeamById(ctx.user.teamId!);
		const result = await stripeClient.subscriptions.list({
			customer: team.customerId!,
			expand: [],
			limit: 1,
		});

		return result.data[0] || null;
	}),

	plans: protectedProcedure.query(async () => {
		const result = await stripeClient.products.list({
			active: true,
			type: "service",
		});

		return result.data;
	}),

	checkout: protectedProcedure
		.input(createCheckoutSchema)
		.mutation(async ({ ctx, input }) => {
			const team = await getTeamById(ctx.user.teamId!);
			const product = await stripeClient.products.retrieve(input.productId);
			const prices = await stripeClient.prices.list({
				product: product.id,
				recurring: {
					interval: input.recurringInterval,
				},
			});

			return await stripeClient.checkout.sessions.create({
				mode: "subscription",
				customer: team.customerId!,
				saved_payment_method_options: {
					payment_method_save: "enabled",
					allow_redisplay_filters: ["always"],
				},
				line_items: prices.data.map((price) => ({
					price: price.id,
					quantity: 1,
				})),
				subscription_data: {
					metadata: {
						planName: product.name,
						teamId: team.id,
					},
				},
				success_url: `${getAppUrl()}/dashboard/settings/billing?checkout=success`,
			});
		}),

	portal: protectedProcedure.mutation(async ({ ctx }) => {
		const team = await getTeamById(ctx.user.teamId!);

		const result = await stripeClient.billingPortal.sessions.create({
			customer: team.customerId!,
			return_url: `${getAppUrl()}/dashboard/settings/billing`,
		});

		return result;
	}),
});
