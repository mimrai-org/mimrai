import Header from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Header />
			{children}
			<GlobalSheets />
		</>
	);
}
