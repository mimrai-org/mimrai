import { stripeClient } from "@api/lib/payments";
import { createCheckoutSchema } from "@api/schemas/billing";
import { protectedProcedure, router } from "@api/trpc/init";
import { buildSubscriptionItems } from "@api/utils/billing";
import { getTeamById } from "@mimir/db/queries/teams";
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
    const plan = getPlanBySlug(team!.plan!);
    const subscription = result.data[0];

    return {
      trialEnd: subscription?.trial_end,
      status: subscription?.status,
      planName: plan?.name,
    };
  }),

  upcomingInvoice: protectedProcedure.query(async ({ ctx }) => {
    const team = await getTeamById(ctx.user.teamId!);
    try {
      if (!team?.subscriptionId) {
        return null;
      }
      const subscription = await stripeClient.subscriptions.retrieve(
        team!.subscriptionId!
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
    .input(createCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      const team = await getTeamById(ctx.user.teamId!);

      const items = await buildSubscriptionItems({
        planSlug: input.planSlug as PlanSlug,
        teamId: team!.id,
        recurringInterval: input.recurringInterval,
      });

      return await stripeClient.checkout.sessions.create({
        mode: "subscription",
        customer: team!.customerId!,
        saved_payment_method_options: {
          payment_method_save: "enabled",
          allow_redisplay_filters: ["always"],
        },
        line_items: items.map((item) => ({
          price: item.id,
          quantity: item.quantity,
        })),
        subscription_data: {
          metadata: {
            planName: input.planSlug,
            teamId: team!.id,
          },
        },
        success_url: `${getAppUrl()}/dashboard/settings/billing?checkout=success`,
      });
    }),

  portal: protectedProcedure.mutation(async ({ ctx }) => {
    const team = await getTeamById(ctx.user.teamId!);

    const result = await stripeClient.billingPortal.sessions.create({
      customer: team!.customerId!,
      return_url: `${getAppUrl()}/dashboard/settings/billing`,
    });

    return result;
  }),
});
