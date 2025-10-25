import { PLANS } from "@mimir/utils/plans";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/utils/trpc";

export const PlanList = ({
	onClickPlan,
}: {
	onClickPlan?: (planId: string, recurringInterval: "month" | "year") => void;
}) => {
	const [billingType, setBillingType] = useState<"month" | "year">("year");
	const { data } = useQuery(trpc.billing.plans.queryOptions());

	const mergedPlans = PLANS.map((plan) => {
		const matchingData = data?.find((d) => d.id === plan.id);
		return {
			...plan,
			stripePlan: matchingData,
		};
	});

	console.log("MERGED PLANS", mergedPlans);

	return (
		<div className="grid auto-cols-fr grid-flow-col gap-4">
			{mergedPlans?.map((plan) => (
				<div key={plan.id} className="flex flex-col border p-4">
					<div className="space-y-1">
						<h3 className="font-medium text-base">{plan.name}</h3>
						<span className="text-xl">
							$
							{billingType === "month"
								? plan.prices.monthly
								: plan.prices.yearly}
							<span className="ml-2 text-muted-foreground">per user/mo</span>
						</span>
					</div>

					<div className="mt-4 flex items-center">
						<Switch
							checked={billingType === "year"}
							onCheckedChange={(checked) =>
								setBillingType(checked ? "year" : "month")
							}
						/>
						<span className="ml-2">
							{billingType === "month" ? "Monthly Billing" : "Yearly Billing"}
						</span>
					</div>

					<div className="mt-8 font-mono text-muted-foreground text-sm uppercase">
						Including:
					</div>
					<ul className="mt-2 flex flex-col gap-1">
						{plan.features?.map((feature, i) => (
							<li key={i} className="flex items-center gap-2 text-sm">
								<CheckIcon className="size-4" />
								{feature}
							</li>
						))}
					</ul>

					<div className="mt-8 text-muted-foreground text-sm">
						This is a beta price and may change in the future.
					</div>
					<Button
						onClick={() => onClickPlan?.(plan.id, billingType)}
						className="mt-2"
					>
						Get {plan.name}
					</Button>
				</div>
			))}
		</div>
	);
};
