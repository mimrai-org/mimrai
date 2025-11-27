import { stripeClient } from "@api/lib/payments";
import { getMembers, getTeamById, updateTeamPlan } from "@db/queries/teams";
import {
	getPlanBySlug,
	getSubscriptionItemByType,
	type PlanSlug,
	type PriceType,
} from "@mimir/utils/plans";

export const checkLimit = async ({
	teamId,
	type,
	movement = 0,
}: {
	teamId: string;
	type: PriceType;
	movement?: number;
}) => {
	if (process.env.DISABLE_BILLING === "true") {
		return true;
	}
	const team = await getTeamById(teamId);
	if (!team) {
		throw new Error("Team not found");
	}
	const plan = getPlanBySlug(team.plan!);
	if (!plan) {
		throw new Error("Plan not found");
	}
	const limit = plan.limits[type];
	if (limit === undefined) {
		return true;
	}

	switch (type) {
		case "users": {
			const members = await getPriceQuantity({ teamId, type: "users" });
			return members + movement <= limit;
		}
		default:
			return true;
	}
};

export const updateSubscriptionUsage = async ({
	teamId,
	type,
}: {
	teamId: string;
	type: PriceType;
}) => {
	if (process.env.DISABLE_BILLING === "true") {
		return;
	}

	const team = await getTeamById(teamId);
	if (team.subscriptionId) {
		const quantity = await getPriceQuantity({
			teamId,
			type,
		});
		const subscription = await stripeClient.subscriptions.retrieve(
			team.subscriptionId,
		);
		const stripePrice = getSubscriptionItemByType(
			type,
			team.plan!,
			subscription,
		);

		if (stripePrice) {
			await stripeClient.subscriptionItems.update(stripePrice.id, {
				quantity,
			});
		}
	}
};

export const getPriceQuantity = async ({
	type,
	teamId,
}: {
	type: PriceType;
	teamId: string;
}) => {
	switch (type) {
		case "users": {
			const members = await getMembers({ teamId });
			return members.length;
		}
		default:
			return 0;
	}
};

export const buildSubscriptionItems = async ({
	planSlug,
	teamId,
	recurringInterval,
}: {
	planSlug: PlanSlug;
	teamId: string;
	recurringInterval: "monthly" | "yearly";
}) => {
	const plan = getPlanBySlug(planSlug);
	if (!plan) {
		throw new Error("Plan not found");
	}
	const prices = plan.pricesIds[recurringInterval];
	const pricesWithQuantities = await Promise.all(
		Object.keys(prices).map(async (priceType) => ({
			price: prices[priceType as PriceType],
			quantity: await getPriceQuantity({
				type: priceType as PriceType,
				teamId,
			}),
		})),
	);
	return pricesWithQuantities;
};

export const createTrialSubscription = async ({
	teamId,
	recurringInterval,
}: {
	teamId: string;
	recurringInterval: "monthly" | "yearly";
}) => {
	const team = await getTeamById(teamId);
	if (!team) {
		throw new Error("Team not found");
	}
	const plan = getPlanBySlug("team"); // Default to starter plan

	if (!plan) {
		throw new Error("Plan not found");
	}

	const items = await buildSubscriptionItems({
		planSlug: plan.slug,
		teamId: team.id,
		recurringInterval,
	});

	const subscription = await stripeClient.subscriptions.create({
		customer: team.customerId!,
		items,
		trial_period_days: 7,
		trial_settings: {
			end_behavior: {
				missing_payment_method: "cancel",
			},
		},
		metadata: {
			planName: plan.name,
			teamId: team.id,
		},
	});

	await updateTeamPlan({
		subscriptionId: subscription.id,
		plan: plan.slug,
		customerId: team.customerId!,
		canceledAt: null,
	});
};
