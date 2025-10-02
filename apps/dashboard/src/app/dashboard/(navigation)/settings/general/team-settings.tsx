import { TeamForm } from "@/components/forms/team-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, trpc } from "@/utils/trpc";

export const TeamSettings = async () => {
	const team = await queryClient.fetchQuery(
		trpc.teams.getCurrent.queryOptions(),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Team Settings</CardTitle>
			</CardHeader>
			<CardContent>
				<TeamForm
					scrollarea={false}
					defaultValues={{
						description: team?.description || undefined,
						name: team?.name || undefined,
						id: team?.id || undefined,
					}}
				/>
			</CardContent>
		</Card>
	);
};
