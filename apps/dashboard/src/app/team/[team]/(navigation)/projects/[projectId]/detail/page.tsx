import { ProjectDetail } from "./project-detail";

type Props = {
	params: Promise<{ projectId: string }>;
};

export default async function Page({ params }: Props) {
	const { projectId } = await params;

	return <ProjectDetail projectId={projectId} />;
}
