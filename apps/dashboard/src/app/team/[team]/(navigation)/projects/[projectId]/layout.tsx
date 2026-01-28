type Props = {
	children: React.ReactNode;
	params: Promise<{ projectId: string; team: string }>;
};

export default async function ProjectLayout({ children, params }: Props) {
	const { projectId, team } = await params;

	return <div className="overflow-x-auto">{children}</div>;
}
