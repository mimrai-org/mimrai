import { redirect } from "next/navigation";

interface Props {
	params: Promise<{ team: string }>;
}

export default async function Page({ params }: Props) {
	const { team } = await params;
	return redirect(`/team/${team}`);
}
