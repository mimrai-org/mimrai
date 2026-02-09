import { NavList } from "../nav-list";

type Props = {
	children: React.ReactNode;
};

export default function Page({ children }: Props) {
	return (
		<div className="mx-auto flex w-full max-w-5xl animate-blur-in">
			<div className="w-full">{children}</div>
		</div>
	);
}
