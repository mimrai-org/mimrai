import { ProjectOverview } from "@/components/projects/overview/overview";
import {
	StickySidebar,
	StickySidebarContainer,
} from "@/components/sticky-sidebar";

type Props = {
	children: React.ReactNode;
	params: Promise<{ projectId: string; team: string }>;
};

export default async function ProjectLayout({ children, params }: Props) {
	const { projectId, team } = await params;

	return (
		<StickySidebarContainer className="h-full grow-1 animate-blur-in">
			<StickySidebar>
				<ProjectOverview projectId={projectId} />
			</StickySidebar>
			<div className="overflow-x-auto">{children}</div>
		</StickySidebarContainer>
	);
}
