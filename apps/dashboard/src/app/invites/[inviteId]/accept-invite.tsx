"use client";

import type { RouterOutputs } from "@mimir/api/trpc";
import { CheckCircleIcon, Loader2Icon } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useMutation } from "node_modules/@tanstack/react-query/build/modern/useMutation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
