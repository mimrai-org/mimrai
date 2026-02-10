import { UserProvider } from "@/components/user-provider";
import { trpcClient } from "@/utils/trpc";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await trpcClient.users.getCurrent.query();

	return <UserProvider user={user}>{children}</UserProvider>;
}
