export const ENV = process.env.NODE_ENV;

export const PLANS = [
	{
		name: "Free",
		slug: "free" as const,
		description: "Essential features for personal use",
		default: false,
		prices: {
			monthly: 0,
			yearly: 0,
		},
		limits: {
			users: 1,
		},
		pricesIds: {
			sandbox: {
				monthly: {
					users: "price_1SY6b0DmvrGQzAG8HjFx94ju",
				},
				yearly: {
					users: "price_1SY6b0DmvrGQzAG8HjFx94ju",
				},
			},
			production: {
				monthly: {
					users: "price_1SY9pQDXvZH4KaApdEyQuVHH",
				},
				yearly: {
					users: "price_1SY9pyDXvZH4KaAp3aNJ2fsQ",
				},
			},
		},
		features: [
			{ name: "Unlimited Tasks", key: "unlimited-tasks" as const },
			{ name: "1 Member", key: "one-member" as const },
		],
	},
	{
		name: "Team",
		slug: "team" as const,
		description: "Basic features for small teams",
		default: true,
		limits: {
			users: undefined,
		},
		prices: {
			monthly: 8,
			yearly: 6,
		},
		pricesIds: {
			sandbox: {
				monthly: {
					users: "price_1SIoxFDmvrGQzAG862L6sGTj",
				},
				yearly: {
					users: "price_1SIpDVDmvrGQzAG89FaEN18h",
				},
			},
			production: {
				monthly: {
					users: "price_1SMH1JDXvZH4KaAprWCb2WGU",
				},
				yearly: {
					users: "price_1SMH1KDXvZH4KaApEyRPUMhS",
				},
			},
		},
		features: [
			{ name: "Unlimited Tasks", key: "unlimited-tasks" as const },
			{ name: "Unlimited Members", key: "unlimited-members" as const },
			{ name: "Basic Analytics", key: "basic-analytics" as const },
			{ name: "AI Assistance", key: "ai" as const },
			{ name: "Priority Support", key: "priority-support" as const },
			{
				name: "Integration with Third-Party Services",
				key: "integrations" as const,
			},
		],
	},
];

export type PriceType =
	keyof (typeof PLANS)[number]["pricesIds"]["sandbox"]["monthly"];
export type PlanSlug = (typeof PLANS)[number]["slug"];
export type PlanFeatureKey = (typeof PLANS)[number]["features"][number]["key"];

export const getPlanByPriceId = (priceId: string) => {
	for (let i = 0; i < PLANS.length; i++) {
		const plan = PLANS[i];
		if (!plan) continue;
		const pricesIds =
			ENV === "production" ? plan.pricesIds.production : plan.pricesIds.sandbox;
		const allPriceIds = Object.values(pricesIds).flatMap((p) =>
			Object.values(p),
		);
		if (allPriceIds.includes(priceId)) {
			return plan;
		}
	}
	return null;
};

export const getPlanBySlug = (slug: PlanSlug) => {
	const plan = PLANS.find((plan) => plan.slug === slug) || null;
	if (!plan) return null;
	return {
		...plan,
		pricesIds:
			ENV === "production" ? plan.pricesIds.production : plan.pricesIds.sandbox,
	};
};

export const getSubscriptionItemByType = (
	type: PriceType,
	planSlug: PlanSlug,
	subscription: {
		items: {
			data: {
				id: string;
				price: {
					id: string;
				};
			}[];
		};
	},
) => {
	const plan = getPlanBySlug(planSlug);
	if (!plan) return null;
	const pricesIds = plan.pricesIds;

	for (const item of subscription.items.data) {
		for (const interval of Object.keys(pricesIds)) {
			const priceId = pricesIds[interval as keyof typeof pricesIds][type];
			if (item.price.id === priceId) {
				return item;
			}
		}
	}
};

export const getPlans = () => {
	return PLANS.map((plan) => ({
		name: plan.name,
		slug: plan.slug,
		description: plan.description,
		prices: plan.prices,
		features: plan.features,
	}));
};
