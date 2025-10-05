"use client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScopes } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";

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
								<div>{format(new Date(invite.createdAt ?? ""), "PP p")}</div>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
