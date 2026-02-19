import { Provider as OpenPanelProvider } from "@mimir/events/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EntitySyncProvider } from "@/components/entity-sync-provider";
import { PanelProvider } from "@/components/panels/panel-context";
import { PanelStack } from "@/components/panels/panel-stack";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { StickySidebarProvider } from "@/components/sticky-sidebar";
import { UserProvider } from "@/components/user-provider";
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

	if (!session?.user?.teamSlug) {
		return redirect("/sign-in");
	}

	// switch to the team in the URL
	try {
		if (session.user?.teamSlug !== team) {
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

	const user = await trpcClient.users.getCurrent.query();

	return (
		<Suspense>
			<UserProvider user={user}>
				<EntitySyncProvider>
					<PanelProvider>
						<GlobalSheets />
						{children}

						{/* {process.env.NODE_ENV === "development" && (
							<ReactQueryDevtools buttonPosition="bottom-left" />
						)} */}
						<OpenPanelProvider profileId={user.id} />
						<PanelStack />
					</PanelProvider>
				</EntitySyncProvider>
			</UserProvider>
		</Suspense>
	);
}
