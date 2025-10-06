import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@mimir/api/ai/types";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatContainer } from "@/components/chat/chat-container";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

type Props = {
	searchParams: Promise<{
		chatId?: string;
	}>;
};

export default async function DashboardPage({ searchParams }: Props) {
	const { chatId } = await searchParams;

	const chat = chatId
		? await queryClient.fetchQuery(trpc.chats.get.queryOptions({ chatId }))
		: null;

	return (
		<div className="mr-6">
			<ChatProvider initialMessages={(chat?.messages as UIChatMessage[]) || []}>
				<div className="flex h-[calc(100vh-110px)] flex-row gap-6">
					<ChatContainer chatId={chatId} />
					<div className="h-full w-full overflow-hidden py-8">
						<KanbanBoard />
					</div>
				</div>
			</ChatProvider>
		</div>
	);
}
