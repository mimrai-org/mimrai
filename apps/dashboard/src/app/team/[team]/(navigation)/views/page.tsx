import { ViewsList } from "@/components/views/list";

interface Props {
	params: Promise<{
		team: string;
	}>;
}

export default async function Page({ params }: Props) {
	const { team } = await params;

	return (
		<div className="animate-blur-in">
			<ViewsList />
		</div>
	);
}
