import { ProjectOverview } from "@/components/projects/overview/overview";

type Props = {
	params: Promise<{ projectId: string }>;
};

export default async function Page({ params }: Props) {
	const { projectId } = await params;

	return <ProjectOverview projectId={projectId} />;
}
