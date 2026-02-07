import { teamCache } from "@mimir/cache/teams-cache";
import {
	getMembers,
	getTeamById,
	updateTeamPlan,
} from "@mimir/db/queries/teams";
import {
	getPlanBySlug,
	getSubscriptionItemByType,
	type PlanFeatureKey,
	type PlanSlug,
	type PriceType,
} from "@mimir/utils/plans";
import type { LanguageModelUsage } from "ai";
import { fetchModels } from "tokenlens";
import { getTokenCosts } from "tokenlens/helpers";
import { stripeClient } from "./lib/payments";

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

	if (!team) {
		throw new Error("Team not found");
	}

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
		case "tokens":
			// Tokens price is metered, no quantity needed
			return undefined as unknown as number;
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
		Object.keys(prices).map(async (priceType) => {
			const quantity = await getPriceQuantity({
				type: priceType as PriceType,
				teamId,
			});

			const limit = plan.limits[priceType as PriceType];

			if (limit !== undefined && quantity > limit) {
				throw new Error(
					`Quantity for ${priceType} exceeds plan limit of ${limit}. Reduce quantity before changing plan.`,
				);
			}

			return {
				price: prices[priceType as PriceType],
				quantity,
			};
		}),
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

export const checkPlanFeatures = async (
	teamId: string,
	features: PlanFeatureKey[],
) => {
	if (process.env.DISABLE_BILLING === "true") {
		return true;
	}

	let team = await teamCache.get(teamId);
	if (!team) {
		team = await getTeamById(teamId);
	}
	if (!team) {
		throw new Error("Team not found");
	}
	teamCache.set(teamId, team);

	const teamPlan = getPlanBySlug(team.plan!);
	if (!teamPlan) {
		throw new Error("Plan not found");
	}
	return features.every((feature) =>
		teamPlan.features.some((f) => f.key === feature),
	);
};

export const createTokenMeter = (customerId: string) => {
	return async ({
		usage,
		model,
	}: {
		usage: LanguageModelUsage;
		model: string;
	}) => {
		if (process.env.DISABLE_BILLING === "true") {
			return null;
		}

		const modelsCatalog = await fetchModels({
			model,
		});

		const modelInfo = modelsCatalog.find((m) => m.model.id === model);

		if (!modelInfo) {
			console.warn(`Model ${model} not found in catalog`);
			return null;
		}

		const tokenCosts = getTokenCosts({
			modelId: model,
			providers: {
				id: modelInfo.provider,
				models: {
					[modelInfo.model.id]: modelInfo.model,
				},
			},
			usage: {
				input_tokens: usage.inputTokens,
				output_tokens: usage.outputTokens,
				cacheReads: usage.inputTokenDetails.cacheReadTokens,
				cacheWrites: usage.inputTokenDetails.cacheWriteTokens,
				reasoning_tokens: usage.outputTokenDetails.reasoningTokens,
			},
		});

		const totalUSD = tokenCosts.totalUSD || 0; // Convert to cents

		if (totalUSD === 0) {
			return null;
		}

		const stripeEventValue = Math.round(totalUSD * 10000) / 10; // in millicents

		await stripeClient.billing.meterEvents.create({
			event_name: "token_usage_cost",
			payload: {
				stripe_customer_id: customerId,
				model,
				// amount in millicents to avoid floating point issues
				value: stripeEventValue.toString(),
			},
		});

		return {
			model,
			costUSD: totalUSD,
			inputTokens: usage.inputTokens,
			outputTokens: usage.outputTokens,
			totalTokens: usage.totalTokens,
		};
	};
};
