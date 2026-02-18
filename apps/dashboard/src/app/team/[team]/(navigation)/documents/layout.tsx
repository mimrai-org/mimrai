import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { DocumentsSidebarLayout } from "@/components/documents/documents-sidebar-layout";

export default function DocumentsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<BreadcrumbSetter
				crumbs={[
					{
						label: "Documents",
						segments: ["documents"],
					},
				]}
			/>
			<DocumentsSidebarLayout>{children}</DocumentsSidebarLayout>
		</>
	);
}
