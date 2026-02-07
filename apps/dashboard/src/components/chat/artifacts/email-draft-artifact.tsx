import type { MessageDataParts } from "@api/ai/tools/tool-registry";
import type { UIChatMessage } from "@api/ai/types";

export const EmailDraftArtifactMessage = ({
	message,
}: {
	message: UIChatMessage;
}) => {
	const parts = message.parts.filter(
		(part) => part.type === "data-email-draft",
	);
	if (parts.length === 0) return null;

	return (
		<div className="flex flex-col gap-2">
			{parts.map((part, index) => (
				<EmailDraftArtifact key={index} data={part.data} />
			))}
		</div>
	);
};

export const EmailDraftArtifact = ({
	data,
}: {
	data: MessageDataParts["email-draft"];
}) => {
	return (
		<div className="rounded-sm border p-4 text-sm">
			<div className="grid grid-cols-[80px_1fr] gap-2 text-left">
				<span className="text-muted-foreground">To</span>
				<span className="font-medium">{data.recipient}</span>
				<span className="text-muted-foreground">Subject</span>
				<span className="font-medium">{data.subject}</span>
			</div>
			<div className="mt-4 whitespace-pre-wrap">{data.body}</div>
		</div>
	);
};
