"use client";

import { Skeleton } from "@mimir/ui/skeleton";
import { DocumentForm } from "@/components/documents/document-form";
import { useDocument } from "@/hooks/use-data";
import { useUser } from "../user-provider";
import { PanelContainer } from "./panel-container";
import { type PanelInstance, usePanel } from "./panel-context";

export const DOCUMENT_PANEL_TYPE = "document";
export const CREATE_DOCUMENT_PANEL_TYPE = "create-document";

interface DocumentPanelProps {
	panel: PanelInstance;
	index: number;
}

function DocumentPanelContent({ panel }: { panel: PanelInstance }) {
	const { data: document } = useDocument(panel.id);

	if (!document) {
		return (
			<div className="p-6">
				<Skeleton className="h-[16px] w-[50px] rounded-sm" />
				<Skeleton className="mt-2 h-[32px] w-full" />
				<Skeleton className="mt-2 h-[100px] w-full" />
			</div>
		);
	}

	return (
		<DocumentForm
			defaultValues={{
				...document,
				labels: document.labels?.map((label) => label.id) || [],
			}}
		/>
	);
}

export function DocumentPanel({ panel, index }: DocumentPanelProps) {
	const user = useUser();
	return (
		<PanelContainer
			panel={panel}
			index={index}
			maximizeLink={`${user.basePath}/documents/${panel.id}`}
		>
			<DocumentPanelContent panel={panel} />
		</PanelContainer>
	);
}

export function CreateDocumentPanel({ panel, index }: DocumentPanelProps) {
	return (
		<PanelContainer panel={panel} index={index}>
			<DocumentForm
				defaultValues={{
					...panel.data,
				}}
			/>
		</PanelContainer>
	);
}

export function useDocumentPanel() {
	return usePanel(DOCUMENT_PANEL_TYPE);
}

export function useCreateDocumentPanel() {
	return usePanel(CREATE_DOCUMENT_PANEL_TYPE);
}
