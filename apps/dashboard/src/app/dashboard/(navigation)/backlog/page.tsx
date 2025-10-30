import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { BacklogList } from "./backlog-list";

export default function Page() {
	return (
		<ChatProvider>
			<BacklogList />
		</ChatProvider>
	);
}
