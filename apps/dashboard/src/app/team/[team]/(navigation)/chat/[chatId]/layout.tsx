import type { UIChatMessage } from "@api/ai/types";
import { cookies } from "next/headers";
import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { ChatProvider } from "@/components/chat/chat-provider";
import { ChatSidebarLayout } from "@/components/chat/chat-sidebar-layout";
import { getSelectedAgentCookieKeyClient } from "@/store/chat";
import { trpcClient } from "@/utils/trpc";

export default async function Layout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ team: string; chatId: string }>;
}) {
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
		<>
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
				<ChatSidebarLayout>
					<div className="mx-auto h-full max-w-4xl p-6">{children}</div>
				</ChatSidebarLayout>
			</ChatProvider>
		</>
	);
}
