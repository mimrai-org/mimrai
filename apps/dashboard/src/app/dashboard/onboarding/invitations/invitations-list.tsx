"use client";

import { Button } from "@mimir/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { queryClient, trpc } from "@/utils/trpc";

export const InvitationsList = ({ email }: { email: string }) => {
	const hasAccepted = useRef(false);
	const { data: teams } = useQuery(trpc.teams.getAvailable.queryOptions());

	const { data } = useQuery(
		trpc.teams.getInvitesByEmail.queryOptions({
			email,
		}),
	);

	const { mutate: acceptInvite, isPending } = useMutation(
		trpc.teams.acceptInvite.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.getAvailable.queryOptions());
				hasAccepted.current = true;
				toast.success("Invitation accepted!");
			},
		}),
	);

	return (
		<ul className="space-y-4">
			{data?.map((invite) => {
				const joined = teams?.some((team) => team.id === invite.team.id);
				return (
					<li key={invite.id}>
						<div className="flex items-center justify-between border p-4">
							<div>
								<span className="font-medium">{invite.team.name}</span>
								<p className="text-muted-foreground text-xs">
									{format(new Date(invite.createdAt!), "PPP")}
								</p>
							</div>
							<div>
								<Button
									variant={"secondary"}
									type="button"
									disabled={joined || isPending}
									onClick={() => acceptInvite({ inviteId: invite.id })}
								>
									{isPending && !joined && (
										<Loader2Icon className="animate-spin" />
									)}
									{joined ? <CheckIcon /> : "Accept"}
								</Button>
							</div>
						</div>
					</li>
				);
			})}
		</ul>
	);
};
