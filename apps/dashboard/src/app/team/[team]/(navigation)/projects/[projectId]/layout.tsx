import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { trpcClient } from "@/utils/trpc";

type Props = {
	children: React.ReactNode;
	params: Promise<{ projectId: string; team: string }>;
};

export default async function ProjectLayout({ children, params }: Props) {
	const { projectId, team } = await params;

	const project = await trpcClient.projects.getById.query({
		id: projectId,
	});

	return (
		<div className="overflow-x-auto">
			<BreadcrumbSetter
				crumbs={[
					{
						label: project.name,
						segments: ["projects", project.id],
					},
				]}
			/>
			{children}
		</div>
	);
}
