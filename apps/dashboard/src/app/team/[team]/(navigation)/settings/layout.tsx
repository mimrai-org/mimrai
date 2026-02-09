import { SettingsSidebar } from "./settings-sidebar";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="mx-auto grid grid-cols-[250px_1fr] gap-8 pt-4 lg:w-7xl">
			<SettingsSidebar />
			<div>{children}</div>
		</div>
	);
}
