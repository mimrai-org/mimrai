import { notFound, redirect } from "next/navigation";
import { trpcClient } from "@/utils/trpc";

type Props = {
	params: Promise<{
		permalinkId: string;
	}>;
};

export default async function Page({ params }: Props) {
	const { permalinkId } = await params;

	const task = await trpcClient.tasks.getByPermalinkId.query({
		permalinkId,
	});

	if (!task) {
		return notFound();
	}

	// switch to the task team
	const newTeam = await trpcClient.users.switchTeam.mutate({
		teamId: task.teamId,
	});

	return redirect(`/team/${newTeam.slug}/workstation/${task.id}`);
}
