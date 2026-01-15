import { NavList } from "./nav-list";

type Props = {
	params: Promise<{
		team: string;
	}>;
};

export default async function Page({ params }: Props) {
	const { team } = await params;
	return (
		<div className="animate-blur-in">
			<NavList />
		</div>
	);
}
