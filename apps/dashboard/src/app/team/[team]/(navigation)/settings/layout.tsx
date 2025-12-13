import { SettingsNavbar } from "./navbar";

type Props = {
	children: React.ReactNode;
};

export default function Page({ children }: Props) {
	return (
		<div className="relative flex w-full flex-1 flex-col gap-6 p-4">
			<SettingsNavbar />
			<main className="flex w-full">
				<div className="w-full">{children}</div>
			</main>
		</div>
	);
}
