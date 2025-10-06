import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Header from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { authClient } from "@/lib/auth-client";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { data: session } = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	console.log({ session });

	if (!session?.user) {
		redirect("/sign-in");
	}

	if ("teamId" in session.user && !session.user.teamId) {
		redirect("/dashboard/onboarding");
	}

	return (
		<>
			<Header />
			{children}
			<GlobalSheets />
		</>
	);
}
