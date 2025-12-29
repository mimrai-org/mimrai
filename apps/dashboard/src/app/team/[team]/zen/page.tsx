import { differenceInDays } from "date-fns";
import { redirect } from "next/navigation";
import { ZenModeEmpty } from "@/components/zen-mode/empty";
import { ZenModeProvider } from "@/components/zen-mode/use-zen-mode";
import { ZenModeWelcome } from "@/components/zen-mode/welcome";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";

export default async function Page() {
	const user = await trpcClient.users.getCurrent.query();
	if (!user?.team?.slug) {
		return redirect("/sign-in");
	}

	await queryClient.prefetchQuery(trpc.tasks.getZenModeQueue.queryOptions());
	const tasks = await queryClient.fetchQuery(
		trpc.tasks.getZenModeQueue.queryOptions(),
	);

	if (!tasks || tasks.data.length === 0) {
		return <ZenModeEmpty />;
	}
	const firstTask = tasks.data[0]!;

	//Last zen mode access is today?
	const today = new Date();
	const lastZenModeAt = user.lastZenModeAt
		? new Date(user.lastZenModeAt)
		: null;
	if (!lastZenModeAt || differenceInDays(today, lastZenModeAt)) {
		trpcClient.users.updateProfile.mutate({
			lastZenModeAt: today,
		});
		return (
			<ZenModeProvider taskId={firstTask.id}>
				<ZenModeWelcome user={user} />
			</ZenModeProvider>
		);
	}

	return redirect(`/team/${user.team.slug}/zen/${firstTask.id}`);
}
