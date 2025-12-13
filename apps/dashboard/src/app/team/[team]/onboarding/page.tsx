import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { queryClient, trpc } from "@/utils/trpc";

export default async function Page() {
	const session = await getSession();

	// If the user is not authenticated, redirect to the sign-in page
	if (!session?.user?.email) {
		return redirect("/sign-in");
	}

	const invitations = await queryClient.fetchQuery(
		trpc.teams.getInvitesByEmail.queryOptions({
			email: session.user.email,
		}),
	);

	// If there are pending invitations, redirect to the invitations page
	if (invitations && invitations.length > 0) return redirect("/invites");

	const teams = await queryClient.fetchQuery(
		trpc.teams.getAvailable.queryOptions(),
	);

	// If the user has no teams, redirect to the create team page
	if (teams && teams.length === 0) {
		return redirect("/create-team");
	}

	const statuses = await queryClient.fetchQuery(
		trpc.statuses.get.queryOptions({
			pageSize: 1,
		}),
	);
	// If the user has no data assets, redirect to the workflow setup page
	if (statuses && statuses.data.length === 0) {
		return redirect(`/team/${session.user.teamSlug}/onboarding/workflow`);
	}

	// If all checks pass, redirect to the main dashboard
	return redirect(`/team/${session.user.teamSlug}`);
}
