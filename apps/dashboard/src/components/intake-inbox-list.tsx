import type { RouterOutputs } from "@mimir/api/trpc";
import { getAvatarColorClass, getFirstInitial } from "@mimir/utils";
import type React from "react";

interface IntakeInboxListProps {
	intakeItems: RouterOutputs["intake"]["getIntakes"]["data"] | undefined;
	selectedId: string | null;
	onSelect: (id: string) => void;
}

const IntakeInboxList: React.FC<IntakeInboxListProps> = ({
	intakeItems,
	selectedId,
	onSelect,
}) => {
	const items = intakeItems || [];

	return (
		<div className="flex h-full w-96 flex-shrink-0 flex-col border-r bg-background">
			{/* Header */}
			<div className="flex h-14 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<svg
						className="h-5 w-5 text-neutral-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
					<h2 className="font-medium text-sm">Pending Items</h2>
				</div>
				<span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
					{items.length}
				</span>
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto">
				{items.map((intakeItem) => {
					const metadata = intakeItem.metadata || {};
					const from = metadata.sender || intakeItem.source || "Unknown";
					const initials = getFirstInitial(from);
					const avatarColor = getAvatarColorClass(intakeItem.id);

					const isUnread = intakeItem.status === "pending";
					const date = new Date(
						intakeItem.createdAt || new Date(),
					).toLocaleDateString();
					const subject =
						metadata.subject ||
						intakeItem.aiAnalysis?.suggestedTitle ||
						"(No Subject)";
					const snippet =
						metadata.snippet ||
						intakeItem.aiAnalysis?.summary ||
						intakeItem.content;

					return (
						<div
							key={intakeItem.id}
							onClick={() => onSelect(intakeItem.id)}
							className={`flex cursor-pointer gap-3 border-b p-4 transition-colors hover:bg-accent/50 ${selectedId === intakeItem.id ? "border-l-2 border-l-primary bg-accent" : "border-l-2 border-l-transparent"}`}
						>
							{/* Avatar */}
							<div
								className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarColor}`}
							>
								{initials}
							</div>

							{/* Content */}
							<div className="flex min-w-0 flex-1 flex-col">
								<div className="mb-0.5 flex items-baseline justify-between">
									<span
										className={`truncate text-sm ${isUnread ? "font-semibold" : "text-muted-foreground"}`}
									>
										{from}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{date}
									</span>
								</div>
								<div
									className={`mb-1 truncate text-xs ${isUnread ? "font-medium" : "text-muted-foreground"}`}
								>
									{subject}
								</div>
								<div className="line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
									{snippet}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default IntakeInboxList;
