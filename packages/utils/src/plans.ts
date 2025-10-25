export const POLAR_ENVIRONMENT = process.env.POLAR_ENVIRONMENT;

export const PLANS = [
  {
    id: "prod_TAzjFHc3KAUZP1",
    name: "Starter",
    slug: "starter" as const,
    description: "Basic features for small teams",
    default: true,
    prices: {
      monthly: 8,
      yearly: 6,
    },
    features: [
      "Unlimited Tasks",
      "AI Assistance",
      "Integration with Third-Party Services",
    ],
  },
];

export const getPlanByProductId = (productId: string) => {
  return PLANS.find((plan) => plan.id === productId)?.slug || null;
};
