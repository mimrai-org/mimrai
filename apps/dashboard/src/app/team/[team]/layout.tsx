import { Provider as OpenPanelProvider } from "@mimir/events/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import {
	STICKY_SIDEBAR_COOKIE,
	StickySidebarProvider,
} from "@/components/sticky-sidebar";
import { UserProvider } from "@/components/user-provider";
import { trpcClient } from "@/utils/trpc";

type Props = {
	children: React.ReactNode;
	params: Promise<{
		team: string;
	}>;
};

export default async function Layout({ children, params }: Props) {
	const { team } = await params;
	const cookieStore = await cookies();
	const user = await trpcClient.users.getCurrent.query();

	if (!user?.id) {
		return redirect("/sign-in");
	}

	// switch to the team in the URL
	try {
		if (user.team?.slug !== team) {
			await trpcClient.users.switchTeam.mutate({
				slug: team,
			});
		}
	} catch (error) {
		if (!user.team?.slug) {
			return redirect("/team");
		}
		return redirect(`/team/${user.team.slug}/onboarding`);
	}

	return (
		<Suspense>
			<StickySidebarProvider
				defaultOpen={cookieStore.get("sticky-sidebar-open")?.value === "true"}
			>
				<UserProvider user={user}>
					<GlobalSheets />
					{children}

					{/* {process.env.NODE_ENV === "development" && (
							<ReactQueryDevtools buttonPosition="bottom-left" />
						)} */}
					<OpenPanelProvider profileId={user.id} />
				</UserProvider>
			</StickySidebarProvider>
		</Suspense>
	);
}
