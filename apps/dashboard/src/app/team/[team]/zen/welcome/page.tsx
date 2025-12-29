import { redirect } from "next/navigation";
import { ZenModeEmpty } from "@/components/zen-mode/empty";
import { ZenModeProvider } from "@/components/zen-mode/use-zen-mode";
import { ZenModeClose } from "@/components/zen-mode/view";
import { ZenModeWelcome } from "@/components/zen-mode/welcome";
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

	return (
		<ZenModeProvider taskId={firstTask.id}>
			<ZenModeClose />
			<ZenModeWelcome user={user} />
		</ZenModeProvider>
	);
}
