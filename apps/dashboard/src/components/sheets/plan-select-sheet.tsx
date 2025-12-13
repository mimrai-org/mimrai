"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
import { Settings2Icon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlanList } from "@/app/team/[team]/(navigation)/settings/billing/plan-list";
import { usePlanParams } from "@/hooks/use-plan-params";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";

export const PlanSelectSheet = () => {
	const user = useUser();
	const pathname = usePathname();
	const { data: subscription } = useQuery(
		trpc.billing.subscription.queryOptions(),
	);
	const { selectPlan, setParams } = usePlanParams();

	const forceOpen =
		subscription &&
		subscription.status !== "active" &&
		subscription.status !== "trialing" &&
		!pathname.startsWith(`${user?.basePath}/settings`);

	const isOpen = Boolean(selectPlan || forceOpen);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={() => (forceOpen ? null : setParams(null))}
		>
			<DialogContent className="min-w-2xl" showCloseButton={!forceOpen}>
				<DialogHeader>
					<DialogTitle className="hidden">Select Plan</DialogTitle>
					<DialogDescription>
						Choose the plan that best fits your needs and upgrade your account.
					</DialogDescription>
				</DialogHeader>
				<PlanList />
				<DialogFooter>
					<div>
						{forceOpen && (
							<Link href={`${user?.basePath}/settings/billing`}>
								<Button size="sm" variant={"secondary"}>
									<Settings2Icon />
									Settings
								</Button>
							</Link>
						)}
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
