import { Button } from "@mimir/ui/button";
import { Switch } from "@mimir/ui/switch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/ui/badge";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { usePlanParams } from "@/hooks/use-plan-params";
import { trpc } from "@/utils/trpc";

export const PlanList = () => {
	const { setParams: setPlanParams } = usePlanParams();
	const [loadingPlanSlug, setLoadingPlanSlug] = useState<string | null>(null);
	const [billingType, setBillingType] = useState<"monthly" | "yearly">(
		"yearly",
	);
	const { data: subscription, isLoading: isSubscriptionLoading } = useQuery(
		trpc.billing.subscription.queryOptions(),
	);
	const { data: team, isLoading: isTeamLoading } = useQuery(
		trpc.teams.getCurrent.queryOptions(),
	);
	const { data } = useQuery(trpc.billing.plans.queryOptions());

	const { mutate: createCheckout, isPending: isCheckoutPending } = useMutation(
		trpc.billing.checkout.mutationOptions({
			onSuccess: (data) => {
				setLoadingPlanSlug(null);
				setPlanParams(null);
				if (data.isUpgradeDowngrade) {
					window.location.reload();
				} else {
					window.open(data.url!, "_blank");
				}
			},
			onError: (error) => {
				toast.error(error.message);
				setLoadingPlanSlug(null);
			},
		}),
	);

	const isLoading = isSubscriptionLoading || isTeamLoading || isCheckoutPending;

	const handleCheckout = async (
		planSlug: string,
		recurringInterval: "monthly" | "yearly",
	) => {
		if (!team) return;
		setLoadingPlanSlug(planSlug);

		createCheckout({
			planSlug,
			recurringInterval,
		});
	};

	return (
		<div className="grid auto-cols-fr grid-flow-col gap-4">
			{data?.map((plan) => {
				if (
					subscription?.planSlug === plan.slug &&
					subscription.status === "active"
				) {
					return null;
				}
				return (
					<div key={plan.slug} className="flex flex-col rounded-sm border p-4">
						<div className="space-y-1">
							<h3 className="font-medium text-base">{plan.name}</h3>
							<span className="text-xl">
								$
								{billingType === "monthly"
									? plan.prices.monthly
									: plan.prices.yearly}
								<span className="ml-2 text-muted-foreground text-sm">
									per user/mo
								</span>
							</span>
						</div>

						<div className="mt-4 flex items-center">
							<Switch
								checked={billingType === "yearly"}
								onCheckedChange={(checked) =>
									setBillingType(checked ? "yearly" : "monthly")
								}
							/>
							<span className="ml-2">
								{billingType === "monthly"
									? "Monthly Billing"
									: "Yearly Billing"}
							</span>
						</div>

						<div className="mt-8 font-mono text-muted-foreground text-sm uppercase">
							Including:
						</div>
						<ul className="mt-2 flex flex-col gap-1">
							{plan.features?.map((feature, i) => (
								<li key={i} className="flex items-center gap-2 text-sm">
									<CheckIcon className="size-4" />
									{feature.name}
								</li>
							))}
						</ul>

						<div className="mt-auto">
							<Button
								onClick={() => handleCheckout(plan.slug, billingType)}
								className="mt-8 w-full"
								disabled={isLoading}
								data-track={`select-plan-${plan.name.toLowerCase()}`}
							>
								{loadingPlanSlug === plan.slug && isLoading && <Loader />}
								Get {plan.name}
							</Button>
						</div>
					</div>
				);
			})}
		</div>
	);
};
