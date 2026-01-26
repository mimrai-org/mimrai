"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { formatRelative } from "date-fns";
import { DotIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { Response } from "@/components/chat/response";
import { queryClient, trpc } from "@/utils/trpc";
import { Editor } from "../editor";
import { CommentInput } from "../forms/task-form/comment-input";
import { ActivityReactions } from "./activity-reactions";

type Activity = RouterOutputs["activities"]["get"]["data"][number];

interface TaskCommentActivityProps {
	activity: Activity;
	taskId: string;
}

export const TaskCommentActivity = ({
	activity,
	taskId,
}: TaskCommentActivityProps) => {
	const [replying, setReplying] = useState(false);
	const replyContainerRef = useRef<HTMLDivElement | null>(null);
	const metadata = activity.metadata as { comment: string };

	useEffect(() => {
		// If click outside of reply container, close it
		const handleClickOutside = (event: MouseEvent) => {
			if (
				replyContainerRef.current &&
				!replyContainerRef.current.contains(event.target as Node)
			) {
				setReplying(false);
			}
		};

		if (replying) {
			document.addEventListener("pointerdown", handleClickOutside);
		} else {
			document.removeEventListener("pointerdown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("pointerdown", handleClickOutside);
		};
	}, [replying]);

	const {
		data: replyComments,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(
		trpc.activities.get.infiniteQueryOptions(
			{
				groupId: activity.id,
				pageSize: 2,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const replyCommentsCount = useMemo(() => {
		if (!replyComments) return 0;
		return replyComments.pages.reduce(
			(total, page) => total + page.data.length,
			0,
		);
	}, [replyComments]);
	const replyCommentsArray = useMemo(() => {
		if (!replyComments) return [];
		return replyComments.pages.flatMap((page) => page.data).reverse();
	}, [replyComments]);

	const { mutate: deleteComment } = useMutation(
		trpc.activities.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting comment...", { id: "delete-comment" });
			},
			onSuccess: () => {
				toast.success("Comment deleted", { id: "delete-comment" });
				if (!activity.groupId) return;
				queryClient.invalidateQueries(
					trpc.activities.get.queryOptions({
						groupId: activity.groupId!,
					}),
				);
			},
			onError: () => {
				toast.error("Failed to delete comment", { id: "delete-comment" });
			},
		}),
	);

	if (!activity.user) return null;

	return (
		<div className="space-y-2">
			<ContextMenu>
				<ContextMenuTrigger>
					<div className="group space-y-1 rounded-sm border px-4 py-4 text-muted-foreground text-sm">
						<div className="flex flex-wrap items-center text-muted-foreground text-xs">
							<AssigneeAvatar
								{...activity.user}
								className="mr-2 size-4 text-xs"
							/>
							<span className="mr-1 font-medium">{activity.user.name}</span>
							<DotIcon />
							{formatRelative(new Date(activity.createdAt!), new Date())}
							<ActivityReactions
								activityId={activity.id}
								reactions={activity.reactions}
							/>
						</div>
						<div className="whitespace-pre-wrap break-words pt-1 text-foreground">
							<Editor value={metadata.comment} readOnly />
						</div>
						<div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
							<Button
								variant={"ghost"}
								size={"sm"}
								type="button"
								className="h-6 text-xs"
								onClick={() => {
									setReplying(true);
								}}
							>
								Reply
							</Button>
						</div>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem
						variant="destructive"
						onClick={() => deleteComment({ id: activity.id })}
					>
						Delete Comment
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

			<AnimatePresence>
				{replying && (
					<motion.div
						animate={{ opacity: 1, height: "auto" }}
						initial={{ opacity: 0, height: 0 }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2 }}
						className="mt-4"
						ref={replyContainerRef}
					>
						<CommentInput taskId={taskId} replyTo={activity.id} autoFocus />
					</motion.div>
				)}
			</AnimatePresence>

			{replyCommentsArray && replyCommentsArray.length > 0 && (
				<div className="space-y-4 pt-4 sm:ml-6 sm:border-l sm:pl-4">
					{hasNextPage && (
						<Button
							variant={"ghost"}
							size={"sm"}
							className="text-muted-foreground text-xs"
							onClick={() => fetchNextPage()}
						>
							Load more previous replies...
						</Button>
					)}
					{replyCommentsArray.map((replyComment) => (
						<TaskCommentActivity
							key={replyComment.id}
							activity={replyComment}
							taskId={taskId}
						/>
					))}
				</div>
			)}
		</div>
	);
};
