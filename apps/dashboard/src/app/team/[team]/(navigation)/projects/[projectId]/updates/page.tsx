import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import { ProjectHealthUpdateForm } from "@/components/forms/project-health-update-form/form";
import { ProjectHealthUpdatesTimeline } from "@/components/forms/project-health-update-form/updates-timeline";
import { trpcClient } from "@/utils/trpc";

type Props = {
	params: Promise<{ projectId: string }>;
};

export default async function Page({ params }: Props) {
	const { projectId } = await params;

	const latest = await trpcClient.projectHealthUpdates.getLatest.query({
		projectId,
	});

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<Card>
				<CardContent>
					<ProjectHealthUpdateForm
						projectId={projectId}
						defaultValues={{
							health: latest?.health,
						}}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<ProjectHealthUpdatesTimeline projectId={projectId} />
				</CardContent>
			</Card>
		</div>
	);
}
