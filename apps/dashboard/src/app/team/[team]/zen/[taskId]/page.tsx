import { ZenModeProvider } from "@/components/zen-mode/use-zen-mode";
import { ZenModeView } from "@/components/zen-mode/view";

type Props = {
	params: Promise<{ taskId: string }>;
};

export default async function Page({ params }: Props) {
	const { taskId } = await params;
	return (
		<ZenModeProvider taskId={taskId}>
			<div className="h-screen overflow-y-auto bg-background px-4 py-12">
				<div className="mx-auto my-auto max-w-3xl">
					<ZenModeView taskId={taskId} />
				</div>
			</div>
		</ZenModeProvider>
	);
}
