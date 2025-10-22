import { setForceLocale, useLocaleStore } from "@mimir/locale";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	// const session = await getSession();

	// if (!session) {
	// 	return redirect("/auth/sign-in");
	// }

	// const locale = session.user?.locale || "en-US";
	// console.log("Locale in layout.tsx:", locale);
	// useLocaleStore.setState({ locale });
	// setForceLocale(locale);

	return <>{children}</>;
}
