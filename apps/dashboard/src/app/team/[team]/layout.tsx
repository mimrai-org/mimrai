import { Provider as OpenPanelProvider } from "@mimir/events/client";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { getSession } from "@/lib/get-session";
import { trpcClient } from "@/utils/trpc";

type Props = {
	children: React.ReactNode;
	params: Promise<{
		team: string;
	}>;
};

export default async function Layout({ children, params }: Props) {
	const { team } = await params;
	const session = await getSession();

	if (!session?.user.id) {
		return redirect("/sign-in");
	}

	// switch to the team in the URL
	try {
		if (session.user.teamSlug !== team) {
			await trpcClient.users.switchTeam.mutate({
				slug: team,
			});
		}
	} catch (error) {
		if (!session.user.teamSlug) {
			return redirect("/team");
		}
		return redirect(`/team/${session.user.teamSlug}/onboarding`);
	}

	return (
		<>
			{children}
			<Suspense>
				<GlobalSheets />

				{/* {process.env.NODE_ENV === "development" && (
					<ReactQueryDevtools buttonPosition="bottom-left" />
				)} */}
				<OpenPanelProvider profileId={session.user.id} />
			</Suspense>
		</>
	);
}
