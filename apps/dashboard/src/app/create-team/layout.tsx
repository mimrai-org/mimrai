import { cookies } from "next/headers";
import { UserProvider } from "@/components/user-provider";
import { trpcClient } from "@/utils/trpc";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const cookieStore = await cookies();
	const user = await trpcClient.users.getCurrent.query();

	return <UserProvider user={user}>{children}</UserProvider>;
}
