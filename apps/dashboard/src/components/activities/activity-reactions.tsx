"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { SmilePlusIcon } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

type Activity = RouterOutputs["activities"]["get"]["data"][number];
type ReactionSummary = Activity["reactions"][number];

interface ActivityReactionsProps {
	activityId: string;
	reactions: ReactionSummary[];
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"];

export const ActivityReactions = ({
	activityId,
	reactions,
}: ActivityReactionsProps) => {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);

	const { mutate: toggleReaction } = useMutation(
		trpc.activitiesReactions.toggle.mutationOptions({
			onSuccess: () => {
				// Invalidate all activities queries to refresh reactions
				queryClient.invalidateQueries({ queryKey: [["activities"]] });
			},
		}),
	);

	const handleReactionClick = (reaction: string) => {
		toggleReaction({ activityId, reaction });
		setIsOpen(false);
	};

	const hasReactions = reactions && reactions.length > 0;

	return (
		<div className="ml-2 flex items-center gap-1">
			{hasReactions &&
				reactions.map((reaction) => (
					<Button
						key={reaction.reaction}
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs hover:bg-muted"
						onClick={() => handleReactionClick(reaction.reaction)}
					>
						{reaction.reaction} {reaction.count}
					</Button>
				))}
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<SmilePlusIcon className="size-3" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-2" align="start">
					<div className="flex gap-1">
						{COMMON_EMOJIS.map((emoji) => (
							<Button
								key={emoji}
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={() => handleReactionClick(emoji)}
							>
								{emoji}
							</Button>
						))}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
};
