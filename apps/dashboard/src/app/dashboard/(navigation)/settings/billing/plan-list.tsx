import { Button } from "@mimir/ui/button";
import { Switch } from "@mimir/ui/switch";
import { PLANS } from "@mimir/utils/plans";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

export const PlanList = ({
	onClickPlan,
}: {
	onClickPlan?: (
		planSlug: string,
		recurringInterval: "monthly" | "yearly",
	) => void;
}) => {
	const [billingType, setBillingType] = useState<"monthly" | "yearly">(
		"yearly",
	);
	const { data } = useQuery(trpc.billing.plans.queryOptions());

	return (
		<div className="grid auto-cols-fr grid-flow-col gap-4">
			{data?.map((plan) => (
				<div key={plan.slug} className="flex flex-col border p-4">
					<div className="space-y-1">
						<h3 className="font-medium text-base">{plan.name}</h3>
						<span className="text-xl">
							$
							{billingType === "monthly"
								? plan.prices.monthly
								: plan.prices.yearly}
							<span className="ml-2 text-muted-foreground">per user/mo</span>
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
							{billingType === "monthly" ? "Monthly Billing" : "Yearly Billing"}
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

					<Button
						onClick={() => onClickPlan?.(plan.slug, billingType)}
						className="mt-8"
						data-track={`select-plan-${plan.name.toLowerCase()}`}
					>
						Get {plan.name}
					</Button>
				</div>
			))}
		</div>
	);
};
