import { queryClient, trpc } from "@/utils/trpc";
import { ChatInterface } from "./chat-interface";
import { ChatProvider } from "./chat-provider";

export const ChatComponent = async ({ chatId }: { chatId?: string }) => {
	const chat = chatId
		? await queryClient.fetchQuery(trpc.chats.get.queryOptions({ chatId }))
		: null;

	return (
		// @ts-expect-error Async Server Component
		<ChatProvider initialMessages={chat?.messages || []} id={chatId || ""}>
			<ChatInterface id={chatId} />
		</ChatProvider>
	);
};
