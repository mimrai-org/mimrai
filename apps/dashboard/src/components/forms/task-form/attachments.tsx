import { Dialog, DialogContent, DialogTrigger } from "@mimir/ui/dialog";
import { FormLabel } from "@mimir/ui/form";
import { DialogTitle } from "@radix-ui/react-dialog";
import { FileTextIcon } from "lucide-react";
import Image from "next/image";

export const TaskAttachments = ({
	attachments = [],
}: {
	attachments?: Array<string>;
}) => {
	if (attachments?.length === 0) return null;
	return (
		<div className="">
			<FormLabel className="mb-4">Attachments</FormLabel>
			<ul className="flex items-center gap-2 p-1">
				{attachments?.map((attachment) => (
					<li key={attachment} className="flex items-center">
						<TaskAttachmentPreview attachment={attachment} />
					</li>
				))}
			</ul>
		</div>
	);
};

export const TaskAttachmentPreview = ({
	attachment,
}: {
	attachment: string;
}) => {
	const url = new URL(attachment);
	const isImage = url.pathname.match(/\.(jpeg|jpg|gif|png)/) != null;

	return (
		<Dialog>
			<DialogTrigger>
				<div className="size-8 items-center justify-center overflow-hidden rounded-md bg-muted">
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
