import { GlobalSheets } from "@/components/sheets/global-sheets";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<GlobalSheets />
			{children}
		</>
	);
}
