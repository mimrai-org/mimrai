"use client";
import { getPlanByKey } from "@mimir/utils/plans";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { PlanList } from "./plan-list";

export const CurrentPlan = () => {
	const { data: team } = useQuery(trpc.teams.getCurrent.queryOptions());
	const { data: subscription, isLoading } = useQuery(
		trpc.billing.subscription.queryOptions(),
	);

	console.log("subscription", subscription);

	const { mutateAsync: createCheckout } = useMutation(
		trpc.billing.checkout.mutationOptions(),
	);

	const { mutateAsync: createPortal } = useMutation(
		trpc.billing.portal.mutationOptions(),
	);

	const handleManageBilling = async () => {
		if (!team) return;

		const data = await createPortal();

		window.location.href = data.url;
	};

	const handleCheckout = async (productId: string) => {
		if (!team) return;

		const data = await createCheckout({
			productId,
			recurringInterval: "month",
		});

		window.location.href = data.url!;
	};

	if (isLoading) {
		return <Skeleton className="h-52 w-full" />;
	}

	if (!subscription) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>No Plan</CardTitle>
					<CardDescription>
						You are currently on the free plan. Upgrade to access more features.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PlanList onClickPlan={handleCheckout} />
				</CardContent>
			</Card>
		);
	}

	const endPeriod = subscription.items.data[0]?.current_period_end;
	const startPeriod = subscription.items.data[0]?.current_period_start;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{subscription.metadata.planName}</CardTitle>
				<CardDescription>
					{startPeriod && format(new Date(startPeriod * 1000), "PPP")}
					{" - "}
					{endPeriod && format(new Date(endPeriod * 1000), "PPP")}
				</CardDescription>
			</CardHeader>
			<CardContent />
			<CardFooter>
				<Button variant="default" onClick={handleManageBilling}>
					Manage
				</Button>
			</CardFooter>
		</Card>
	);
};
