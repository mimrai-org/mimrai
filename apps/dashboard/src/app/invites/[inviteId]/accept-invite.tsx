"use client";

import type { RouterOutputs } from "@mimir/api/trpc";
import { Button } from "@mimir/ui/button";
import { Card, CardContent } from "@mimir/ui/card";
import { useMutation } from "@tanstack/react-query";
import { CheckCircleIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const TeamInvite = ({
	invite,
}: {
	invite: RouterOutputs["teams"]["getInviteById"];
}) => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { mutateAsync: acceptInvite } = useMutation(
		trpc.teams.acceptInvite.mutationOptions(),
	);

	const handleAcceptInvite = async () => {
		setLoading(true);
		try {
			await acceptInvite({ inviteId: invite?.id! });
			await authClient.refreshToken({
				providerId: "email",
			});
			router.push("/dashboard");
		} catch (error) {
			setLoading(false);
		}
	};

	return (
		<Card className="text-center">
			<CardContent>
				<h1 className="max-w-sm text-lg">
					You have been invited to join the team at <b>{invite?.team.name}</b>
				</h1>
				<div className="mt-6 flex justify-center gap-2">
					<Button
						type="button"
						className="w-38 justify-between"
						onClick={handleAcceptInvite}
						disabled={loading}
					>
						Accept Invite
						{loading ? (
							<Loader2Icon className="animate-spin" />
						) : (
							<CheckCircleIcon />
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};
