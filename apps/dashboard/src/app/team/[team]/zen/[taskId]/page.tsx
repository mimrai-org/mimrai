import { ZenModeDevTools } from "@/components/zen-mode/devtools";
import { ZenModeProvider } from "@/components/zen-mode/use-zen-mode";
import { ZenModeSessionProvider } from "@/components/zen-mode/use-zen-mode-session";
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

	const settings = await trpcClient.zen.getSettings.query();

	return (
		<ZenModeProvider taskId={taskId}>
			<ZenModeSessionProvider settings={settings}>
				<div className="h-screen overflow-y-auto bg-background px-4 py-12">
					<div className="relative mx-auto my-auto max-w-4xl">
						<ZenModeView />
						{process.env.NODE_ENV === "development" && <ZenModeDevTools />}
					</div>
				</div>
			</ZenModeSessionProvider>
		</ZenModeProvider>
	);
}
