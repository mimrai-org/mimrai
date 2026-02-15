import { generateId } from "ai";
import { redirect } from "next/navigation";

interface Props {
	params: Promise<{ team: string }>;
}

export default async function Page({ params }: Props) {
	const { team } = await params;

	const newChatId = generateId();

	return redirect(`/team/${team}/chat/${newChatId}`);
}
