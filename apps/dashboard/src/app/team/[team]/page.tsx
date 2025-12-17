import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { trpcClient } from "@/utils/trpc";

type Props = {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
	}>;
};

export default async function Page({ searchParams }: Props) {
	const session = await getSession();
	if (!session?.user) {
		return redirect("/sign-in");
	}

	const team = await trpcClient.teams.getCurrent.query();
	if (!team) {
		return redirect(`/team/${session.user.teamSlug}/onboarding`);
	}

	// redirect to overview with search params
	const paramsToRedirect = await searchParams;
	const queryString = new URLSearchParams(
		paramsToRedirect as Record<string, string>,
	).toString();
	return redirect(`/team/${team?.slug}/overview?${queryString}`);
}
