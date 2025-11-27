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
import { Settings2Icon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlanList } from "@/app/dashboard/(navigation)/settings/billing/plan-list";
import { usePlanParams } from "@/hooks/use-plan-params";
import { trpc } from "@/utils/trpc";

export const PlanSelectSheet = () => {
	const pathname = usePathname();
	const { data: subscription } = useQuery(
		trpc.billing.subscription.queryOptions(),
	);
	const { selectPlan, setParams } = usePlanParams();

	const forceOpen =
		subscription &&
		subscription.status !== "active" &&
		!pathname.startsWith("/dashboard/settings");

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
							<Link href="/dashboard/settings/billing">
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
