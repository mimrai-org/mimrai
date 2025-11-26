"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useShareableParams } from "@/hooks/use-shareable-params";
import { trpc } from "@/utils/trpc";
import { ShareableForm } from "../forms/shareable-form";

export const ShareableCreateSheet = () => {
	const {
		createShareable,
		shareableId,
		shareableResourceId,
		shareableResourceType,
		setParams,
	} = useShareableParams();

	const isOpen = Boolean(createShareable);

	const { data: shareable, isFetched } = useQuery(
		trpc.shareable.getByResourceId.queryOptions(
			{
				resourceId: shareableResourceId!,
				resourceType: shareableResourceType!,
			},
			{
				enabled: Boolean(shareableResourceId && shareableResourceType),
			},
		),
	);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={() => setParams({ createShareable: null })}
		>
			<DialogContent
				showCloseButton={true}
				className="max-h-[85vh] overflow-y-auto"
			>
				<DialogHeader>
					<DialogTitle>Share</DialogTitle>
				</DialogHeader>
				<div className="pt-0">
					{(isFetched || !shareableId) && (
						<ShareableForm
							defaultValues={{
								id: shareable?.id,
								authorizedEmails: shareable?.authorizedEmails
									? shareable.authorizedEmails.join(", ")
									: "",
								policy: shareable?.policy || "private",
								resourceId: shareableResourceId ?? "",
								resourceType: shareableResourceType ?? "",
							}}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
