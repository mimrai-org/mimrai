"use client";

import { Form, FormControl, FormField, FormItem } from "@mimir/ui/form";
import { useMutation } from "@tanstack/react-query";
import type { Editor as EditorInstance } from "@tiptap/react";
import { FileTextIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type z from "zod";
import { Editor } from "@/components/editor";
import { LabelInput } from "@/components/forms/task-form/label-input";
import { ResourceIconPicker } from "@/components/resource-icon/resource-icon-picker";
import { useUser } from "@/components/user-provider";
import {
	invalidateDocumentsCache,
	updateDocumentInCache,
} from "@/hooks/use-data-cache-helpers";
import { useFormAutoSave, useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { DocumentChildren } from "./document-children";
import { documentFormSchema } from "./form-type";

export const DocumentForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof documentFormSchema>>;
}) => {
	const user = useUser();
	const router = useRouter();
	const editorRef = useRef<EditorInstance | null>(null);
	const [lastSavedDate, setLastSavedDate] = useState<Date>(new Date());

	const form = useZodForm(documentFormSchema, {
		defaultValues: {
			name: "",
			icon: null,
			content: "",
			labels: [],
			parentId: null,
			...defaultValues,
		},
	});

	const id = form.watch("id");

	const { mutate: createDocument, isPending: isPendingCreate } = useMutation(
		trpc.documents.create.mutationOptions({
			onMutate: () => {
				toast.loading("Creating document...", { id: "create-document" });
			},
			onSuccess: (doc) => {
				toast.success("Document created", { id: "create-document" });
				invalidateDocumentsCache();
				router.push(`${user.basePath}/documents/${doc.id}`);
			},
			onError: () => {
				toast.error("Failed to create document", { id: "create-document" });
			},
		}),
	);

	const { mutate: updateDocument, isPending: isPendingUpdate } = useMutation(
		trpc.documents.update.mutationOptions({
			onSuccess: (doc) => {
				setLastSavedDate(new Date());
			},
			onError: () => {
				toast.error("Failed to update document", { id: "update-document" });
			},
		}),
	);

	const onSubmit = async (data: z.infer<typeof documentFormSchema>) => {
		if (data.id) {
			const payload = {
				id: data.id,
				...data,
			};
			updateDocument(payload);
			updateDocumentInCache({
				...payload,
				labels: undefined,
			});
		} else {
			createDocument({
				...data,
			});
		}
	};

	useFormAutoSave(form, onSubmit, {
		enabled: Boolean(id),
	});

	const createMode = !id;

	return (
		<div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="pt-0">
						<div className="space-y-1 py-2">
							{/* Icon + Title */}
							<div className="flex items-center gap-2 px-4 py-2">
								<FormField
									control={form.control}
									name="icon"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<ResourceIconPicker
													value={field.value}
													onChange={field.onChange}
													fallback={FileTextIcon}
													className="size-6 text-xl"
												/>
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<DocumentTitle
													value={field.value}
													onChange={field.onChange}
													onBlur={field.onBlur}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</div>

							{/* Properties row */}
							<div className="flex flex-wrap items-center gap-4 px-4 py-2">
								{/* <DocumentParentSelect /> */}
								<FormField
									control={form.control}
									name="labels"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<LabelInput
													className="w-fit justify-start px-0 text-xs"
													placeholder="Add labels..."
													value={field.value ?? []}
													onChange={(value) => field.onChange(value)}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Children list (only when editing an existing document) */}
						{id && <DocumentChildren documentId={id} />}

						{/* Content editor */}
						<div className="px-4">
							<FormField
								control={form.control}
								name="content"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Editor
												className="editor-xl [&_.tiptap]:min-h-[300px]"
												placeholder="Write document content..."
												value={field.value ?? ""}
												onChange={(value) => {
													field.onChange(value);
												}}
												ref={editorRef}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
};

function DocumentTitle({
	value,
	onChange,
	onBlur,
}: {
	value: string;
	onChange: (val: string) => void;
	onBlur: () => void;
}) {
	const initialValue = useRef(value);

	return (
		<div className="relative">
			<div
				className="font-medium focus-visible:outline-none focus-visible:ring-0 md:text-3xl"
				onBlur={(e) => {
					onBlur();
				}}
				onInput={(e) => {
					onChange(e.currentTarget.textContent || "");
				}}
				role="textbox"
				tabIndex={0}
				contentEditable
				suppressContentEditableWarning
			>
				{initialValue.current}
			</div>
			{!value && (
				<span className="pointer-events-none absolute top-0 left-0 text-muted-foreground sm:text-2xl">
					Document name
				</span>
			)}
		</div>
	);
}
