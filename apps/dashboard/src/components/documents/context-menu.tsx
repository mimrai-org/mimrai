import { useMutation } from "@tanstack/react-query";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { ArrowUpRightIcon, FilePlus, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Document } from "@/hooks/use-data";
import { invalidateDocumentQueries } from "@/store/entity-mutations";
import { trpc } from "@/utils/trpc";
import {
	useCreateDocumentPanel,
	useDocumentPanel,
} from "../panels/document-panel";
import { useUser } from "../user-provider";

export const DocumentContextMenu = ({
	children,
	document,
}: {
	children: React.ReactNode;
	document: Document;
}) => {
	const user = useUser();
	const documentPanel = useDocumentPanel();
	const router = useRouter();

	const { mutate: deleteDocument, isPending: isPendingDelete } = useMutation(
		trpc.documents.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting document...", { id: "delete-document" });
			},
			onSuccess: () => {
				toast.success("Document deleted", { id: "delete-document" });
				invalidateDocumentQueries();
			},
			onError: () => {
				toast.error("Failed to delete document", { id: "delete-document" });
			},
		}),
	);

	const { mutate: createDocument, isPending: isPendingCreate } = useMutation(
		trpc.documents.create.mutationOptions({
			onMutate: () => {
				toast.loading("Creating document...", { id: "create-document" });
			},
			onSuccess: (doc) => {
				toast.success("Document created", { id: "create-document" });
				invalidateDocumentQueries();
				router.push(`${user.basePath}/documents/${doc.id}`);
			},
			onError: () => {
				toast.error("Failed to create document", { id: "create-document" });
			},
		}),
	);

	const handleOpenPanel = () => {
		documentPanel.open(document.id);
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onSelect={handleOpenPanel}>
					<ArrowUpRightIcon />
					Open in panel
				</ContextMenuItem>
				<ContextMenuItem
					onSelect={() =>
						createDocument({
							name: "",
							content: "",
							parentId: document.id,
						})
					}
					disabled={isPendingCreate}
				>
					<FilePlus />
					Create child document
				</ContextMenuItem>
				<ContextMenuItem
					variant="destructive"
					onSelect={() => deleteDocument({ id: document.id })}
					disabled={isPendingDelete}
				>
					<TrashIcon />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
