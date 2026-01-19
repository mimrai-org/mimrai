import { ViewsList } from "@/components/views/list";

interface Props {
	params: Promise<{ projectId: string; team: string }>;
}

export default async function Page({ params }: Props) {
	const { projectId, team } = await params;

	return (
		<div className="animate-blur-in">
			<ViewsList projectId={projectId} />
		</div>
	);
}
