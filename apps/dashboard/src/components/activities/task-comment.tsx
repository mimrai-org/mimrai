"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { ChevronRightIcon, TrashIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { queryClient, trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import { Response } from "../chat/response";
import { Editor } from "../editor";
import { CommentInput } from "../forms/task-form/comment-input";
import { BaseActivity } from "./base-activity";
import type { Activity } from "./types";

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
					<div className="group space-y-1 rounded-sm border py-4 text-muted-foreground text-sm">
						{activity.replyToActivity && (
							<div className="mx-4 mb-2 flex items-start gap-2 rounded-sm bg-muted/50 p-2 text-muted-foreground">
								<div className="space-y-1">
									<div className="flex items-center text-xs">
										<AssigneeAvatar
											{...activity.replyToActivity.user}
											className="mr-1 size-4"
										/>
										{activity.replyToActivity.user.name}
									</div>
									<Response className="text-xs [&>*]:leading-4!">
										{activity.replyToActivity.metadata.comment.slice(0, 200)}
									</Response>
								</div>
							</div>
						)}
						<BaseActivity activity={activity} />
						<div className="whitespace-pre-wrap break-words px-4 pt-1 text-foreground">
							<Editor value={metadata.comment} readOnly />
						</div>
						<div className="flex justify-end px-4 opacity-0 transition-opacity group-hover:opacity-100">
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
						<TrashIcon />
						Delete
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
						<CommentInput
							taskId={taskId}
							replyTo={
								activity.groupId === taskId ? activity.id : activity.groupId
							}
							autoFocus
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
