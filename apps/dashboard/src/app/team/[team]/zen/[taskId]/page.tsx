import { ZenModeProvider } from "@/components/zen-mode/use-zen-mode";
import { ZenModeView } from "@/components/zen-mode/view";
import { trpcClient } from "@/utils/trpc";

type Props = {
	params: Promise<{ taskId: string }>;
};

export default async function Page({ params }: Props) {
	const { taskId } = await params;
	const today = new Date();
	trpcClient.zen.updateLastActivity.mutate({
		date: today,
	});

	return (
		<ZenModeProvider taskId={taskId}>
			<div className="h-screen overflow-y-auto bg-background px-4 py-12">
				<div className="relative mx-auto my-auto max-w-4xl">
					<ZenModeView />
				</div>
			</div>
		</ZenModeProvider>
	);
}
