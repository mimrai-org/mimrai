import { redirect } from "next/navigation";
import Header from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { getSession } from "@/lib/get-session";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	if (!session?.user) {
		return redirect("/sign-in");
	}

	if ("teamId" in session.user && !session.user.teamId) {
		return redirect("/dashboard/onboarding");
	}

	return (
		<>
			<Header />
			{children}
			<GlobalSheets />
		</>
	);
}
