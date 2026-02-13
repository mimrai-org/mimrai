"use client";

import { CREDIT_PACKS } from "@mimir/utils/plans";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
import { Coins } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { useScopes } from "@/hooks/use-scopes";
import { trpc } from "@/utils/trpc";

const formatUsd = (amountCents: number) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amountCents / 100);
};

export const NavCredits = () => {
	const [amountCents, setAmountCents] = useState(CREDIT_PACKS[0]);
	const [custom, setCustom] = useState(false);
	const [open, setOpen] = useState(false);
	const canWrite = useScopes(["team:write"]);
	const { data, isLoading } = useQuery(
		trpc.billing.creditsBalance.queryOptions(),
	);

	const { mutate: purchaseCredits, isPending } = useMutation(
		trpc.billing.purchaseCredits.mutationOptions({
			onSuccess: (result) => {
				if (result?.url) {
					window.open(result.url, "_blank", "noopener,noreferrer");
				}
				setOpen(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const balanceCents = data?.balanceCents ?? 0;

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="h-8 gap-2 px-3"
				onClick={() => setOpen(true)}
				disabled={!canWrite}
			>
				<Coins className="size-4" />
				{isLoading ? "..." : formatUsd(balanceCents)}
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Buy credits</DialogTitle>
						<DialogDescription>
							Purchase credits to use towards your AI agent interactions.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 flex flex-col items-center justify-center gap-8">
						{custom ? (
							<input
								type="number"
								className="h-15 w-full text-center text-6xl text-foreground placeholder:text-muted-foreground"
								placeholder="Amount (USD)"
								value={amountCents / 100}
								onChange={(e) => {
									const value = Math.max(1, Number(e.target.value)) * 100;
									setAmountCents(value);
								}}
							/>
						) : (
							<button
								type="button"
								className="text-6xl"
								onClick={() => {
									setCustom(true);
								}}
							>
								{formatUsd(amountCents)}
							</button>
						)}

						<div className="flex gap-4">
							{CREDIT_PACKS.map((packAmountCents) => (
								<Button
									key={packAmountCents}
									type="button"
									size="sm"
									variant={
										amountCents === packAmountCents && !custom
											? "secondary"
											: "outline"
									}
									disabled={isPending}
									onClick={() => {
										setAmountCents(packAmountCents);
										setCustom(false);
									}}
								>
									{isPending && <Loader />}
									{formatUsd(packAmountCents)}
								</Button>
							))}
							<Button
								type="button"
								size="sm"
								variant={custom ? "secondary" : "outline"}
								disabled={isPending}
								onClick={() => setCustom(true)}
							>
								Custom
							</Button>
						</div>
					</div>

					<DialogFooter className="mt-4 flex justify-end gap-2">
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={() => setOpen(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={() => purchaseCredits({ amountCents })}
							disabled={isPending}
						>
							Continue to Payment
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
