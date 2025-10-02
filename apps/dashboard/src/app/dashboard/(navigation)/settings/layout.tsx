import { SettingsSidebar } from "./sidebar";

type Props = {
	children: React.ReactNode;
};

export default function Page({ children }: Props) {
	return (
		<div className="grid w-full flex-1 grid-cols-[200px_1fr]">
			<SettingsSidebar />
			<main className="flex w-full">
				<div className="mx-auto w-full px-12 py-10">{children}</div>
			</main>
		</div>
	);
}
