import { ProjectOverview } from "@/components/projects/overview/overview";

type Props = {
	children: React.ReactNode;
	params: Promise<{ projectId: string; team: string }>;
};

export default async function ProjectLayout({ children, params }: Props) {
	const { projectId, team } = await params;

	return (
		<div className="grid h-full grow-1 animate-blur-in grid-cols-[350px_1fr] gap-6">
			<div className="sticky top-12 h-[calc(100vh-100px)]">
				<ProjectOverview projectId={projectId} />
			</div>
			<div className="overflow-x-auto">{children}</div>
		</div>
	);
}
