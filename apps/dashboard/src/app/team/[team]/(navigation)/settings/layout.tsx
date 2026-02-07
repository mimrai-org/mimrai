import { SettingsSidebar } from "./settings-sidebar";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="grid grid-cols-[250px_1fr]">
			<SettingsSidebar />
			<div>{children}</div>
		</div>
	);
}
