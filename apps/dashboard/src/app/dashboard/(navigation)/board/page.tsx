import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { Suspense } from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";

type Props = {
	searchParams: Promise<{
		chatId?: string;
	}>;
};

export default function DashboardPage({ searchParams }: Props) {
	return (
		<div className="">
			<ChatProvider>
				<div className="flex flex-row gap-6">
					{/*<ChatContainer chatId={chatId} />*/}
					<div className="h-full w-full overflow-hidden">
						<Suspense>
							<KanbanBoard />
						</Suspense>
					</div>
				</div>
			</ChatProvider>
		</div>
	);
}
