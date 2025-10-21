"use client";
import { useQuery } from "@tanstack/react-query";
import { TeamForm } from "@/components/forms/team-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export const TeamSettings = () => {
	const { data: team } = useQuery(trpc.teams.getCurrent.queryOptions());

	return (
		<Card>
			<CardHeader>
				<CardTitle>Team Settings</CardTitle>
			</CardHeader>
			<CardContent>
				{team ? (
					<TeamForm
						scrollarea={false}
						defaultValues={{
							description: team?.description || undefined,
							name: team?.name || undefined,
							email: team?.email || undefined,
							locale: team?.locale || undefined,
							timezone: team?.timezone || undefined,
							id: team?.id || undefined,
						}}
					/>
				) : (
					<Skeleton className="h-10 w-full" />
				)}
			</CardContent>
		</Card>
	);
};
