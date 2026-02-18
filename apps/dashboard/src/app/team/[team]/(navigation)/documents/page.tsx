import { FileTextIcon } from "lucide-react";

export default function DocumentsPage() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 text-center">
			<div className="mb-2 size-10 text-muted-foreground">
				<FileTextIcon className="size-full" />
			</div>
			<h3 className="font-header font-medium text-xl">Documents</h3>
			<p className="max-w-md text-balance text-muted-foreground text-sm">
				Your shared knowledge base. Create documents to store guides,
				procedures, and reference material that everyone can access.
			</p>
		</div>
	);
}
