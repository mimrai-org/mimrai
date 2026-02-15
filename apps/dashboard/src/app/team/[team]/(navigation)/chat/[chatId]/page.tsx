import type { UIChatMessage } from "@api/ai/types";
import { cookies } from "next/headers";
import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { ChatHistory } from "@/components/chat/chat-history";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatProvider } from "@/components/chat/chat-provider";
import { getSelectedAgentCookieKeyClient } from "@/store/chat";
import { trpcClient } from "@/utils/trpc";

interface Props {
	params: Promise<{ team: string; chatId: string }>;
}

export default async function Page({ params }: Props) {
	const { chatId } = await params;
	const cookieStore = await cookies();

	const currentTeam = await trpcClient.teams.getCurrent.query();

	const chat = await trpcClient.chats.get.query({
		chatId,
	});

	const selectedAgentId = cookieStore.get(
		getSelectedAgentCookieKeyClient(currentTeam.id),
	)?.value;

	return (
		<div className="grid h-[calc(100vh-100px)] w-full flex-1 grid-cols-[250px_1fr]">
			<BreadcrumbSetter
				crumbs={[
					{
						label: chat?.title || "New Conversation",
						segments: ["chat", chatId],
					},
				]}
			/>
			<ChatProvider
				initialMessages={(chat?.messages as UIChatMessage[]) || []}
				id={chatId}
				title={chat?.title}
				initialSelectedAgentId={selectedAgentId}
			>
				<div className="rounded-sm p-4">
					<ChatHistory />
				</div>
				<div className="mx-auto flex h-[calc(100vh-100px)] w-full max-w-4xl flex-1 flex-col">
					<ChatInterface />
				</div>
			</ChatProvider>
		</div>
	);
}
