import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { ChatHistory } from "@/components/chat/chat-history";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatProvider } from "@/components/chat/chat-provider";
import { trpcClient } from "@/utils/trpc";

interface Props {
	params: Promise<{ team: string; chatId: string }>;
}

export default async function Page({ params }: Props) {
	const { team, chatId } = await params;

	const chat = await trpcClient.chats.get.query({
		chatId,
	});

	return (
		<div className="grid max-h-[calc(100vh-80px)] w-full flex-1 grid-cols-[250px_1fr]">
			<BreadcrumbSetter
				crumbs={[
					{
						label: chat?.title || "New Conversation",
						segments: ["chat", chatId],
					},
				]}
			/>
			<ChatProvider
				initialMessages={chat?.messages || []}
				id={chatId}
				title={chat?.title}
			>
				<ChatHistory />
				<div className="mx-auto flex max-h-[calc(100vh-80px)] w-full max-w-4xl flex-1 flex-col">
					<ChatInterface />
				</div>
			</ChatProvider>
		</div>
	);
}
