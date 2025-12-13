import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function Page() {
	const session = await getSession();

	if (!session?.user) {
		return redirect("/sign-in");
	}

	// TODO: Improve invite flow

	if ("teamId" in session.user && !session.user.teamId) {
		return redirect(`/team/${session.user.teamSlug}/onboarding`);
	}

	return redirect("/team");
}
