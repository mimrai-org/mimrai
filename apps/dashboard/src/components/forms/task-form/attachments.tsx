import { Dialog, DialogContent, DialogTrigger } from "@mimir/ui/dialog";
import { FormField, FormLabel } from "@mimir/ui/form";
import { getApiUrl } from "@mimir/utils/envs";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { Skeleton } from "@ui/components/ui/skeleton";
import { FileTextIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { TaskFormValues } from "./form-type";

export const Attachments = () => {
	const form = useFormContext<TaskFormValues>();

	const uploadingState = form.watch("attachmentsUploadingState");

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files && files.length > 0) {
			const fileUrls = Array.from(files).map((file) =>
				URL.createObjectURL(file),
			);

			const currentUploading =
				form.getValues("attachmentsUploadingState") || [];
			const newUploading = fileUrls.map((url) => ({
				url,
				progress: 0,
				id: crypto.randomUUID(),
			}));
			form.setValue("attachmentsUploadingState", [
				...currentUploading,
				...newUploading,
			]);

			// Handle upload logic
			Promise.all(
				Array.from(files).map(async (file, index) => {
					const formData = new FormData();
					formData.append("file", file);
					console.log("Uploading file:", file.name);

					const response = await fetch(
						`${getApiUrl()}/api/attachments/upload`,
						{
							method: "POST",
							body: formData,
							credentials: "include",
						},
					);

					const data = await response.json();
					const url = data.url as string;

					// Update attachments field
					const currentAttachments = form.getValues("attachments") || [];
					form.setValue("attachments", [...currentAttachments, url], {
						shouldDirty: true,
					});

					// Remove from uploading state
					const updatedUploading = form
						.getValues("attachmentsUploadingState")
						?.filter((item) => item.id !== newUploading[index].id);
					form.setValue("attachmentsUploadingState", updatedUploading);
				}),
			);
		}
	};

	return (
		<FormField
			control={form.control}
			name="attachments"
			render={({ field }) => (
				<div className="">
					<ul className="flex flex-wrap items-center gap-2 p-1">
						{field.value?.map((attachment, index) => (
							<li key={attachment} className="flex items-center">
								<TaskAttachmentPreview
									attachment={attachment}
									onRemove={() => {
										field.onChange(field.value?.filter((_, i) => i !== index));
									}}
									index={index}
								/>
							</li>
						))}

						{uploadingState?.map((upload) => (
							<li key={upload.id} className="flex items-center">
								<Skeleton className="size-8 animate-pulse rounded-sm" />
							</li>
						))}
						<input
							type="file"
							className="hidden"
							id="attachment-input"
							multiple
							onChange={handleInputChange}
						/>
						<label htmlFor="attachment-input">
							<div
								className="flex size-8 items-center justify-center rounded-sm border border-dashed hover:bg-accent dark:hover:bg-accent/30"
								title="Add Attachment"
							>
								<PlusIcon className="size-4 text-muted-foreground" />
							</div>
						</label>
					</ul>
				</div>
			)}
		/>
	);
};

export const TaskAttachmentPreview = ({
	attachment,
	onRemove,
	index,
}: {
	attachment: string;
	onRemove: (index: number) => void;
	index: number;
}) => {
	const url = useMemo(() => {
		if (!attachment?.startsWith("http")) {
			return null;
		}
		return new URL(attachment);
	}, [attachment]);
	const isImage = url?.pathname.match(/\.(jpeg|jpg|gif|png)/) != null;

	if (!url) {
		return null;
	}

	return (
		<Dialog>
			<DialogTrigger>
				<ContextMenu>
					<ContextMenuTrigger>
						<div className="size-8 items-center justify-center overflow-hidden rounded-md border bg-muted">
							{isImage ? (
								<Image
									src={attachment}
									alt=""
									className="size-8 object-cover"
									width={64}
									height={64}
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center">
									<FileTextIcon className="size-4" />
								</div>
							)}
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem
							variant="destructive"
							onClick={() => onRemove?.(index)}
						>
							Remove
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className="m-0 flex h-auto min-w-[70vw] flex-col items-center justify-center border-0 bg-transparent p-0"
			>
				<DialogTitle className="size-0" />
				{isImage ? (
					<Image
						src={attachment}
						alt={"Attachment Preview"}
						className="size-full object-contain"
						width={800}
						height={600}
					/>
				) : (
					<a
						href={attachment}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary underline"
					>
						Open Attachment
					</a>
				)}
			</DialogContent>
		</Dialog>
	);
};
