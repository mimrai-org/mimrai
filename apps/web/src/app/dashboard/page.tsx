import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat/chat";
import { KanbanBoard } from "@/components/kanban-board";
import { authClient } from "@/lib/auth-client";

export default async function DashboardPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (!session.data) {
		redirect("/login");
	}

	const { data: customerState, error } = await authClient.customer.state({
		fetchOptions: {
			headers: await headers(),
		},
	});

	return (
		<div className="mx-6 mt-6">
			<KanbanBoard />
			<Chat />
		</div>
	);
}
