"use client";

import { useMutation } from "@tanstack/react-query";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { cn } from "@ui/lib/utils";
import {
	CopyCheckIcon,
	CopyIcon,
	RefreshCwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useAIChat } from "./chat-provider";

interface ChatMessageActionsProps {
	messageId: string;
	messageContent: string;
}

export function ChatMessageActions({
	messageId,
	messageContent,
}: ChatMessageActionsProps) {
	const { id: chatId, regenerate } = useAIChat();
	const [feedbackGiven, setFeedbackGiven] = useState<
		"positive" | "negative" | null
	>(null);
	const [copied, setCopied] = useState(false);

	const createFeedbackMutation = useMutation(
		trpc.chatFeedback.create.mutationOptions(),
	);

	const deleteFeedbackMutation = useMutation(
		trpc.chatFeedback.delete.mutationOptions(),
	);

	const handleRegenerate = () => {
		regenerate?.({
			messageId,
		});
	};

	const handlePositive = () => {
		if (feedbackGiven === "positive") {
			// Already gave positive feedback, remove feedback
			setFeedbackGiven(null);

			if (!chatId) return;

			deleteFeedbackMutation.mutate({
				chatId,
				messageId,
			});
			return;
		}

		setFeedbackGiven("positive");

		if (!chatId) return;

		createFeedbackMutation.mutate({
			chatId,
			messageId,
			type: "positive",
		});
	};

	const handleNegative = () => {
		if (feedbackGiven === "negative") {
			// Already gave negative feedback, remove feedback
			setFeedbackGiven(null);

			if (!chatId) return;

			deleteFeedbackMutation.mutate({
				chatId,
				messageId,
			});
			return;
		}

		setFeedbackGiven("negative");

		if (!chatId) return;

		createFeedbackMutation.mutate({
			chatId,
			messageId,
			type: "negative",
		});
	};

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(messageContent);
			setCopied(true);
			// Reset the copied state after 2 seconds
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy to clipboard:", err);
		}
	};

	return (
		<div className="flex items-center gap-1">
			{/* Copy Button */}
			<div>
				<TooltipProvider delayDuration={200}>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={copyToClipboard}
								className="flex h-6 w-6 items-center justify-center transition-colors duration-200 hover:bg-muted"
							>
								{copied ? (
									<CopyCheckIcon className="zoom-in-50 size-3.5 animate-in duration-200" />
								) : (
									<CopyIcon className="size-3 text-muted-foreground hover:text-foreground" />
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent className="px-2 py-1 text-xs">
							<p>{copied ? "Copied!" : "Copy response"}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			{/* Retry Button */}
			<div>
				<TooltipProvider delayDuration={200}>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={handleRegenerate}
								className="flex h-6 w-6 items-center justify-center transition-colors duration-200 hover:bg-muted"
							>
								<RefreshCwIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
							</button>
						</TooltipTrigger>
						<TooltipContent className="px-2 py-1 text-xs">
							<p>Retry response</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			{/* Positive Feedback Button */}
			<div>
				<TooltipProvider delayDuration={200}>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={handlePositive}
								disabled={
									createFeedbackMutation.isPending ||
									deleteFeedbackMutation.isPending
								}
								className={cn(
									"flex h-6 w-6 items-center justify-center transition-colors duration-200 hover:bg-muted",
									(createFeedbackMutation.isPending ||
										deleteFeedbackMutation.isPending) &&
										"cursor-not-allowed opacity-50",
								)}
							>
								<ThumbsUpIcon
									className={cn(
										"h-3 w-3",
										feedbackGiven === "positive"
											? "fill-foreground text-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								/>
							</button>
						</TooltipTrigger>
						<TooltipContent className="px-2 py-1 text-xs">
							<p>
								{feedbackGiven === "positive"
									? "Remove positive feedback"
									: "Positive feedback"}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			{/* Negative Feedback Button */}
			<div>
				<TooltipProvider delayDuration={200}>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={handleNegative}
								disabled={
									createFeedbackMutation.isPending ||
									deleteFeedbackMutation.isPending
								}
								className={cn(
									"flex h-6 w-6 items-center justify-center transition-colors duration-200 hover:bg-muted",
									(createFeedbackMutation.isPending ||
										deleteFeedbackMutation.isPending) &&
										"cursor-not-allowed opacity-50",
								)}
							>
								<ThumbsDownIcon
									className={cn(
										"h-3 w-3",
										feedbackGiven === "negative"
											? "fill-foreground text-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								/>
							</button>
						</TooltipTrigger>
						<TooltipContent className="px-2 py-1 text-xs">
							<p>
								{feedbackGiven === "negative"
									? "Remove negative feedback"
									: "Negative feedback"}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
}
