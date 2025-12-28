"use client";
import { t } from "@mimir/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@mimir/ui/card";
import { Skeleton } from "@mimir/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { TeamForm } from "@/components/forms/team-form";
import { trpc } from "@/utils/trpc";

export const TeamSettings = () => {
	const { data: team } = useQuery(trpc.teams.getCurrent.queryOptions());

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.general.team.title")}</CardTitle>
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
							slug: team?.slug || undefined,
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
