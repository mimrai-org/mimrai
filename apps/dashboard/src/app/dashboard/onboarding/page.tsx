import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { queryClient, trpc } from "@/utils/trpc";

export default async function Page() {
	const session = await getSession();

	if (!session?.user?.email) {
		return redirect("/sign-in");
	}

	const invitations = await queryClient.fetchQuery(
		trpc.teams.getInvitesByEmail.queryOptions({
			email: session.user.email,
		}),
	);
	if (invitations && invitations.length > 0)
		return redirect("/dashboard/onboarding/invitations");

	const teams = await queryClient.fetchQuery(
		trpc.teams.getAvailable.queryOptions(),
	);
	if (teams && teams.length === 0) {
		return redirect("/dashboard/onboarding/create-team");
	}

	return redirect("/dashboard");
}
