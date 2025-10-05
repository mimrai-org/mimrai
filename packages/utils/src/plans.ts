export const POLAR_ENVIRONMENT = process.env.POLAR_ENVIRONMENT;

export const PLANS = {
	production: {
		starter: {
			id: "",
			name: "Starter",
			key: "starter",
		},
		enterprise: {
			id: "",
			name: "Enterprise",
			key: "enterprise",
		},
	},
	sandbox: {
		starter: {
			id: "prod_TAzjFHc3KAUZP1",
			name: "Starter",
			key: "starter",
		},
		enterprise: {
			id: "prod_TAzjFHc3KAUZP1",
			name: "Enterprise",
			key: "enterprise",
		},
	},
};

export const getPlans = () => {
	return PLANS[POLAR_ENVIRONMENT as keyof typeof PLANS] || PLANS.sandbox;
};

export const getPlanByKey = (key: keyof (typeof PLANS)["sandbox"]) => {
	const plan = getPlans()[key];

	if (!plan) {
		throw new Error("Plan not found");
	}

	return plan;
};

export function getPlanByProductId(
	productId: string,
): keyof (typeof PLANS)["sandbox"] {
	const plan = Object.values(getPlans()).find((plan) => plan.id === productId);

	if (!plan) {
		throw new Error("Plan not found");
	}

	return plan.key as keyof (typeof PLANS)["sandbox"];
}
