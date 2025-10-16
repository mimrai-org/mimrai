"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { EllipsisIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useScopes } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";

export const MembersInvitesList = () => {
	const canWriteTeam = useScopes(["team:write"]);
	const { data: invites } = useQuery(
		trpc.teams.getInvites.queryOptions(
			{},
			{
				enabled: canWriteTeam,
			},
		),
	);

	const { mutate: deleteInvite } = useMutation(
		trpc.teams.deleteInvite.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.getInvites.queryOptions());
				toast.success("Invite deleted");
			},
		}),
	);

	if (!canWriteTeam) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Pending invites</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					{invites?.data.map((invite) => (
						<li
							key={invite.id}
							className="flex items-center gap-2 border-b px-2 py-4 last:border-0"
						>
							<div className="flex w-full justify-between text-sm">
								<div className="font-medium">{invite.email}</div>
								<div className="flex items-center gap-2">
									<div className="text-muted-foreground">
										{format(new Date(invite.createdAt ?? ""), "PP p")}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												size={"icon"}
												variant={"ghost"}
												disabled={!canWriteTeam}
											>
												<EllipsisIcon className="size-4" />
											</Button>
										</DropdownMenuTrigger>

										<DropdownMenuContent className="w-56" align="end">
											{canWriteTeam && (
												<DropdownMenuItem
													onClick={() => deleteInvite({ inviteId: invite.id })}
													variant="destructive"
												>
													Delete
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
