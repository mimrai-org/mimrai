"use client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

export const MembersList = () => {
	const { data: members } = useQuery(trpc.teams.getMembers.queryOptions());

	return (
		<Card>
			<CardHeader>
				<CardTitle>Members</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					{members?.map((member) => (
						<li
							key={member.id}
							className="flex items-center gap-2 border-b px-2 py-4 last:border-0"
						>
							<Avatar>
								<AvatarFallback>
									{member.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="text-sm">
								<div className="font-medium">{member.name}</div>
								<div>{member.email}</div>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
