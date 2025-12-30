import { getDate } from "date-fns";
import { redirect } from "next/navigation";
import { ZenModeEmpty } from "@/components/zen-mode/empty";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";

export default async function Page() {
	const user = await trpcClient.users.getCurrent.query();
	if (!user?.team?.slug) {
		return redirect("/sign-in");
	}

	const tasks = await queryClient.fetchQuery(trpc.zen.queue.queryOptions());

	if (!tasks || tasks.data.length === 0) {
		return <ZenModeEmpty />;
	}
	const firstTask = tasks.data[0]!;

	const settings = await trpcClient.zen.getSettings.query();

	//Last zen mode access is today?
	const today = new Date();
	const lastZenModeAt = settings.lastZenModeAt
		? new Date(settings.lastZenModeAt)
		: null;
	if (!lastZenModeAt || getDate(today) !== getDate(lastZenModeAt)) {
		return redirect(`/team/${user.team.slug}/zen/welcome`);
	}

	return redirect(`/team/${user.team.slug}/zen/${firstTask.id}`);
}
