import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { trpcClient } from "@/utils/trpc";

export default async function CreateDocumentPage() {
	const session = await getSession();

	if (!session?.user?.teamSlug) {
		redirect("/sign-in");
	}

	const newDocument = await trpcClient.documents.create.mutate({
		name: "",
		content: "",
	});

	return redirect(`/team/${session.user.teamSlug}/documents/${newDocument.id}`);
}
