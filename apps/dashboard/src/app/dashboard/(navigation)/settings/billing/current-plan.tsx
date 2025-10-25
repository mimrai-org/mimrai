"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
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

	const { data: upcomingInvoice } = useQuery(
		trpc.billing.upcomingInvoice.queryOptions(),
	);

	console.log("upcomingInvoice", upcomingInvoice);

	const { mutateAsync: createCheckout } = useMutation(
		trpc.billing.checkout.mutationOptions(),
	);

	const { mutateAsync: createPortal } = useMutation(
		trpc.billing.portal.mutationOptions(),
	);

	const trialDaysLeft = useMemo(() => {
		if (!subscription?.trial_end) return 0;
		const now = Math.floor(Date.now() / 1000);
		const diff = subscription.trial_end - now;
		return Math.max(Math.ceil(diff / (60 * 60 * 24)), 0);
	}, [subscription]);

	const handleManageBilling = async () => {
		if (!team) return;

		const data = await createPortal();

		window.location.href = data.url;
	};

	const handleCheckout = async (
		productId: string,
		recurringInterval: "month" | "year",
	) => {
		if (!team) return;

		const data = await createCheckout({
			productId,
			recurringInterval,
		});

		window.open(data.url!, "_blank");
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
				<CardTitle className="flex items-center gap-2">
					{subscription.metadata.planName}
					{subscription.trial_end && !subscription.canceled_at && (
						<Badge>{trialDaysLeft} days left</Badge>
					)}
				</CardTitle>
				<CardDescription>
					{startPeriod && format(new Date(startPeriod * 1000), "PPP")}
					{" - "}
					{endPeriod && format(new Date(endPeriod * 1000), "PPP")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{upcomingInvoice && (
					<div className="mb-4">
						<h4 className="mb-2 font-medium">Upcoming Invoice</h4>
						<div className="space-y-1">
							<div className="flex justify-between">
								<span>Amount Due:</span>
								<span>
									${((upcomingInvoice.amount_due || 0) / 100).toFixed(2)}
								</span>
							</div>
							{upcomingInvoice.lines.data.map((line) => (
								<div
									key={line.id}
									className="flex justify-between text-muted-foreground text-sm"
								>
									<span>{line.description}</span>
									<span>${((line.amount || 0) / 100).toFixed(2)}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
			<CardFooter>
				<Button variant="default" onClick={handleManageBilling}>
					Manage
				</Button>
			</CardFooter>
		</Card>
	);
};
