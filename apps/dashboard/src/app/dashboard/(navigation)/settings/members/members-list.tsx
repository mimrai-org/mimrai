"use client";
import { t } from "@mimir/locale";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EllipsisIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/kanban/asignee";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemberParams } from "@/hooks/use-member-params";
import { useScopes, useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";

export const MembersList = () => {
	const user = useUser();
	const { setParams } = useMemberParams();
	const { data: members } = useQuery(trpc.teams.getMembers.queryOptions());
	const { mutateAsync: leaveTeam } = useMutation(
		trpc.teams.leave.mutationOptions({
			onSuccess: () => {
				location.reload();
			},
		}),
	);
	const { mutateAsync: removeMember } = useMutation(
		trpc.teams.removeMember.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.getMembers.queryOptions());
			},
		}),
	);
	const { mutateAsync: transferOwnership } = useMutation(
		trpc.teams.transferOwnership.mutationOptions({
			onSuccess: () => {
				window.location.reload();
			},
		}),
	);

	const canTeamWrite = useScopes(["team:write"]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.members.membersList.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					{members?.map((member) => (
						<li
							key={member.id}
							className="flex items-center justify-between gap-2 border-b px-2 py-4 last:border-0"
						>
							<div className="flex items-center gap-2">
								<AssigneeAvatar className="size-8" {...member} />
								<div className="text-sm">
									<div className="font-medium">{member.name}</div>
									<div className="text-muted-foreground">{member.email}</div>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<div className="text-muted-foreground text-sm capitalize">
									{member.role}
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size={"icon"}
											variant={"ghost"}
											disabled={!canTeamWrite && member.id !== user?.id}
										>
											<EllipsisIcon className="size-4" />
										</Button>
									</DropdownMenuTrigger>

									<DropdownMenuContent className="w-56" align="end">
										{canTeamWrite && (
											<DropdownMenuItem
												onClick={() => setParams({ memberId: member.id })}
											>
												Edit Member
											</DropdownMenuItem>
										)}

										{canTeamWrite && member.id !== user?.id && (
											<>
												<DropdownMenuItem
													variant="destructive"
													onClick={() =>
														transferOwnership({ userId: member.id })
													}
												>
													Transfer Ownership
												</DropdownMenuItem>
												<DropdownMenuItem
													variant="destructive"
													onClick={() => removeMember({ userId: member.id })}
												>
													Remove from Team
												</DropdownMenuItem>
											</>
										)}

										{member.id === user?.id && (
											<DropdownMenuItem
												variant="destructive"
												onClick={() => leaveTeam()}
											>
												Leave Team
											</DropdownMenuItem>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
