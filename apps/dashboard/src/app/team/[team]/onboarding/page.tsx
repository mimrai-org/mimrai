import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";

export default async function Page() {
	const session = await getSession({
		cache: "no-cache",
	});

	// If the user is not authenticated, redirect to the sign-in page
	if (!session?.user?.email) {
		return redirect("/sign-in");
	}

	const invitations = await trpcClient.teams.getInvitesByEmail.query({
		email: session.user.email,
	});

	// If there are pending invitations, redirect to the invitations page
	if (invitations && invitations.length > 0) return redirect("/invites");

	const teams = await trpcClient.teams.getAvailable.query();

	// If the user has no teams, redirect to the create team page
	if (teams && teams.length === 0) {
		return redirect("/create-team");
	}

	let teamSlug = session.user.teamSlug;

	if (!teamSlug) {
		// If the user has teams but no current team, switch to the first available team
		teamSlug = teams[0]!.slug;
		await trpcClient.users.switchTeam.mutate({
			slug: teams[0]!.slug,
		});
	}

	const statuses = await queryClient.fetchQuery(
		trpc.statuses.get.queryOptions({
			pageSize: 1,
		}),
	);
	// If the user has no data assets, redirect to the workflow setup page
	if (statuses && statuses.data.length === 0) {
		return redirect(`/team/${teamSlug}/onboarding/workflow`);
	}

	// If all checks pass, redirect to the main dashboard
	return redirect(`/team/${teamSlug}`);
}
