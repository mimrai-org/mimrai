import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function Page() {
	const session = await getSession({
		cache: "no-cache",
	});

	if (!session?.user) {
		return redirect("/sign-in");
	}

	// TODO: Improve invite flow

	if ("teamSlug" in session.user && !session.user.teamSlug) {
		return redirect(`/team/${session.user.teamSlug}/onboarding`);
	}

	return redirect("/team");
}
