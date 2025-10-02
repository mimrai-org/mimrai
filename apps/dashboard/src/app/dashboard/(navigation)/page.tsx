import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatComponent } from "@/components/chat/chat-component";
import { KanbanBoard } from "@/components/kanban-board";
import { authClient } from "@/lib/auth-client";

type Props = {
	searchParams: Promise<{
		chatId?: string;
	}>;
};

export default async function DashboardPage({ searchParams }: Props) {
	const { chatId } = await searchParams;

	const { data: session } = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (!session?.user) {
		redirect("/sign-in");
	}

	console.log(session);

	if ("teamId" in session.user && !session.user.teamId) {
		redirect("/dashboard/onboarding");
	}

	return (
		<div className="mr-6">
			<div className="grid h-[calc(100vh-110px)] grid-cols-[450px_1fr] gap-6">
				<div className="h-full border-r">
					<ChatComponent chatId={chatId} />
				</div>
				<div className="py-8">
					<KanbanBoard />
				</div>
			</div>
		</div>
	);
}
