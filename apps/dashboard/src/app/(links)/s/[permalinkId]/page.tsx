import { notFound } from "next/navigation";
import { ProjectShareable } from "@/components/shareables/project/project";
import { TaskShareable } from "@/components/shareables/task";
import { trpcClient } from "@/utils/trpc";

type Props = {
	params: Promise<{
		permalinkId: string;
	}>;
};

export default async function Page({ params }: Props) {
	const { permalinkId } = await params;

	const resource = await trpcClient.shareable.getResource.query({
		id: permalinkId,
	});

	if (!resource?.data) {
		return notFound();
	}

	switch (resource?.type) {
		case "task":
			// render task view page
			return <TaskShareable task={resource.data} />;
		case "project":
			// render project view
			return (
				<ProjectShareable
					project={resource.data.project!}
					tasks={resource.data.tasks}
				/>
			);
		default:
			return notFound();
	}
}
