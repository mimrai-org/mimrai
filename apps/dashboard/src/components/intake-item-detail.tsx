import type { RouterOutputs } from "@mimir/api/trpc";
import { getAvatarColorClass, getFirstInitial } from "@mimir/utils";
import { format } from "date-fns";
import { Mail } from "lucide-react";
import type React from "react";

interface IntakeItemDetailProps {
	selectedItem:
		| RouterOutputs["intake"]["getIntakes"]["data"][number]
		| undefined;
}

const IntakeItemDetail: React.FC<IntakeItemDetailProps> = ({
	selectedItem,
}) => {
	if (!selectedItem) {
		return (
			<div className="flex h-full flex-1 flex-col items-center justify-center text-muted-foreground">
				<Mail className="mb-4 h-12 w-12 opacity-20" />
				<h3 className="font-medium">Select an item to review</h3>
				<p className="text-sm">Choose a pending item to view details</p>
			</div>
		);
	}

	const metadata = selectedItem.metadata || {};
	const from = metadata.sender || "Unknown";
	const fromEmail = metadata.sender || "";
	const subject =
		metadata.subject || selectedItem.aiAnalysis?.suggestedTitle || "No Subject";
	const initials = getFirstInitial(from);
	const avatarColor = getAvatarColorClass(selectedItem.id);

	return (
		<div className="flex h-full flex-1 flex-col overflow-hidden">
			{/* Email Header */}
			<div className="flex-shrink-0 border-b p-6 pb-4">
				<h1 className="mb-2 font-semibold text-lg">{subject}</h1>
				<div className="flex items-center gap-3">
					<div
						className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${avatarColor}`}
					>
						{initials}
					</div>
					<div>
						<div className="text-sm">
							{from}{" "}
							{fromEmail && (
								<span className="text-muted-foreground text-xs">
									&lt;{fromEmail}&gt;
								</span>
							)}
						</div>
						<div className="text-muted-foreground text-xs">
							{selectedItem.createdAt &&
								format(
									new Date(selectedItem.createdAt),
									"MMM d, yyyy 'at' h:mm a",
								)}
						</div>
					</div>
				</div>
			</div>

			{/* Email Body */}
			<div className="flex-1 overflow-y-auto whitespace-pre-wrap p-6 text-sm leading-relaxed">
				{metadata.originalHtml ? (
					<div
						className="prose prose-sm dark:prose-invert max-w-none"
						dangerouslySetInnerHTML={{
							__html: metadata.originalHtml,
						}}
					/>
				) : (
					selectedItem.content
				)}
			</div>
		</div>
	);
};

export default IntakeItemDetail;
