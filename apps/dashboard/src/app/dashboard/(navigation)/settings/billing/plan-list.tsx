import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

export const PlanList = ({
	onClickPlan,
}: {
	onClickPlan?: (planId: string) => void;
}) => {
	const { data } = useQuery(trpc.billing.plans.queryOptions());

	return (
		<div>
			{data?.map((plan) => (
				<div
					key={plan.id}
					className="flex items-center justify-between border-b py-4 last:border-0"
				>
					<div>
						<h3 className="font-medium text-base">{plan.name}</h3>
						<p className="text-sm">{plan.description}</p>
					</div>
					<Button onClick={() => onClickPlan?.(plan.id)}>
						Get {plan.name}
					</Button>
				</div>
			))}
		</div>
	);
};
