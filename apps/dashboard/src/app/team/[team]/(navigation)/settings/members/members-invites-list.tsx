"use client";
import { t } from "@mimir/locale";
import { Button } from "@mimir/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mimir/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@mimir/ui/dropdown-menu";
import { getAppUrl } from "@mimir/utils/envs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CopyIcon, EllipsisIcon } from "lucide-react";
import { Toaster, toast } from "sonner";
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
				<CardTitle>{t("settings.members.pendingInvites.title")}</CardTitle>
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
											<DropdownMenuItem
												onSelect={() => {
													navigator.clipboard.writeText(
														`${getAppUrl()}/invites/${invite.id}?email=${invite.email}`,
													);
													toast.success("Invite link copied to clipboard");
												}}
											>
												<CopyIcon />
												Copy Link
											</DropdownMenuItem>
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
