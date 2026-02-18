import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { DocumentForm } from "@/components/documents/document-form";
import { trpcClient } from "@/utils/trpc";

type Props = {
	params: Promise<{ documentId: string }>;
};

export default async function DocumentPage({ params }: Props) {
	const { documentId } = await params;

	const document = await trpcClient.documents.getById.query({
		id: documentId,
	});

	console.log("DocumentPage", { documentId, document });

	if (!document) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Document not found</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-5xl animate-blur-in">
			<BreadcrumbSetter
				crumbs={[
					{
						label: "Documents",
						segments: ["documents"],
					},
					{
						label: document.name,
						segments: ["documents", documentId],
					},
				]}
			/>
			<DocumentForm
				defaultValues={{
					...document,
					labels: document.labels?.map((l) => l.id) || [],
				}}
			/>
		</div>
	);
}
