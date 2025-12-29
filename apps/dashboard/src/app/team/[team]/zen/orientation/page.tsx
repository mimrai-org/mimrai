import { redirect } from "next/navigation";
import { ZenModeEmpty } from "@/components/zen-mode/empty";
import { ZenModeOrientation } from "@/components/zen-mode/orientation";
import { ZenModeProvider } from "@/components/zen-mode/use-zen-mode";
import { ZenModeClose } from "@/components/zen-mode/view";
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

	const orientation = await queryClient.fetchQuery(
		trpc.zen.orientation.queryOptions(),
	);

	if (orientation.activities.length === 0) {
		return redirect(`/team/${user.team.slug}/zen/${firstTask.id}`);
	}

	return (
		<ZenModeProvider taskId={firstTask.id}>
			<ZenModeClose />
			<ZenModeOrientation initialData={orientation} />
		</ZenModeProvider>
	);
}
