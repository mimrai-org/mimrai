import { ChatInterface } from "@/components/chat/chat-interface";

export default async function Page() {
	return (
		<div className="h-full flex-1 animate-blur-in">
			<ChatInterface />
		</div>
	);
}
