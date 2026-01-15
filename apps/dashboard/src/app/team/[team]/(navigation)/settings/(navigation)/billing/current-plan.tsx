"use client";
import { Alert, AlertDescription, AlertTitle } from "@mimir/ui/alert";
import { Button } from "@mimir/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import { Skeleton } from "@mimir/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { usePlanParams } from "@/hooks/use-plan-params";
import { trpc } from "@/utils/trpc";
import { PlanList } from "./plan-list";

export const CurrentPlan = () => {
	const { setParams: setPlanParams } = usePlanParams();
	const { data: team } = useQuery(trpc.teams.getCurrent.queryOptions());
	const { data: subscription, isLoading } = useQuery(
		trpc.billing.subscription.queryOptions(),
	);

	const { data: upcomingInvoice } = useQuery(
		trpc.billing.upcomingInvoice.queryOptions(),
	);

	const { mutateAsync: createPortal } = useMutation(
		trpc.billing.portal.mutationOptions(),
	);

	const trialDaysLeft = useMemo(() => {
		if (!subscription?.trialEnd) return 0;
		const now = Math.floor(Date.now() / 1000);
		const diff = subscription.trialEnd - now;
		return Math.max(Math.ceil(diff / (60 * 60 * 24)), 0);
	}, [subscription]);

	const handleManageBilling = async () => {
		if (!team) return;

		const data = await createPortal();

		window.location.href = data.url;
	};

	if (isLoading) {
		return <Skeleton className="h-52 w-full" />;
	}

	if (!subscription || subscription.status !== "active") {
		return (
			<Card>
				<CardHeader>
					<CardDescription>Select a plan continue using Mimrai</CardDescription>
				</CardHeader>
				<CardContent>
					<PlanList />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{subscription.planName}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{trialDaysLeft > 0 && (
					<Alert>
						<AlertTitle className="text-yellow-600">
							You're on a free trial
						</AlertTitle>
						<AlertDescription>
							You are currently in a free trial with {trialDaysLeft} days left.
						</AlertDescription>
					</Alert>
				)}
				{upcomingInvoice && (
					<div className="mb-4">
						<h4 className="font-medium text-muted-foreground text-sm">
							Upcoming Invoice
						</h4>
						{upcomingInvoice.amountDue === 0 ? (
							<p className="text-muted-foreground text-sm">
								No upcoming charges.
							</p>
						) : (
							<div className="space-y-1">
								<p className="font-medium text-2xl">
									${(upcomingInvoice.amountDue / 100).toFixed(2)}
								</p>
							</div>
						)}
					</div>
				)}
			</CardContent>
			<CardFooter className="flex gap-2">
				{subscription?.status === "active" && (
					<Button
						variant="default"
						onClick={() => {
							setPlanParams({
								selectPlan: true,
							});
						}}
					>
						Upgrade
					</Button>
				)}
				<Button variant="secondary" type="button" onClick={handleManageBilling}>
					{trialDaysLeft > 0 ? "Upgrade" : "Manage Billing"}
				</Button>
			</CardFooter>
		</Card>
	);
};
