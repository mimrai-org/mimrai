import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { queryClient, trpc } from "@/utils/trpc";
import { ChatInterface } from "./chat-interface";

export const ChatComponent = async ({ chatId }: { chatId?: string }) => {
	const chat = chatId
		? await queryClient.fetchQuery(trpc.chats.get.queryOptions({ chatId }))
		: null;

	return (
		// @ts-expect-error Async Server Component
		<ChatProvider initialMessages={chat?.messages || []}>
			<ChatInterface id={chatId} />
		</ChatProvider>
	);
};
