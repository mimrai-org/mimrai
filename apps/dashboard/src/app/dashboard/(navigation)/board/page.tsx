import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { Suspense } from "react";
import { Board } from "@/components/kanban/board/board";

type Props = {
	searchParams: Promise<{
		chatId?: string;
	}>;
};

export default function DashboardPage({ searchParams }: Props) {
	return (
		<ChatProvider>
			<div className="flex h-full flex-row gap-6">
				{/*<ChatContainer chatId={chatId} />*/}
				<div className="h-full w-full overflow-hidden">
					<Suspense>
						<Board />
					</Suspense>
				</div>
			</div>
		</ChatProvider>
	);
}
