import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ projectId: string; team: string }>;
};

export default async function Page({ params }: Props) {
	const { projectId, team } = await params;
	return redirect(`/team/${team}/projects/${projectId}/detail`);
}
