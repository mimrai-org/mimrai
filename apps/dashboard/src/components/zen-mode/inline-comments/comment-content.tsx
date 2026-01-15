"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { formatRelative } from "date-fns";
import {
	CheckIcon,
	EllipsisVerticalIcon,
	PencilIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import Loader from "@/components/loader";
import { useUser } from "@/components/user-provider";
import { queryClient, trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../../asignee-avatar";
import { Response } from "../../chat/response";
import { Editor } from "../../editor";
import type { Activity } from "./use-inline-comments";

type CommentContentProps = {
	activity: Activity;
	comment: string;
	taskId: string;
	parentId?: string;
	compact?: boolean;
	onDeleted?: () => void;
	onEditingChange?: (isEditing: boolean) => void;
};

export const CommentContent = ({
	activity,
	comment,
	taskId,
	parentId,
	compact = false,
	onDeleted,
	onEditingChange,
}: CommentContentProps) => {
	const user = useUser();
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState("");

	const isOwner = user?.id === activity.user?.id;

	const invalidateQueries = () => {
		// Invalidate the parent comment's replies if this is a reply
		if (parentId) {
			queryClient.invalidateQueries(
				trpc.activities.get.queryOptions({
					groupId: parentId,
					type: ["task_comment"],
					pageSize: 100,
				}),
			);
		}
		// Always invalidate task comments
		queryClient.invalidateQueries(
			trpc.activities.get.queryOptions({
				groupId: taskId,
				type: ["task_comment"],
				pageSize: 100,
			}),
		);
	};

	const { mutate: updateComment, isPending } = useMutation(
		trpc.tasks.updateComment.mutationOptions({
			onSettled: (comment) => {
				if (!comment) return;
				if (comment.status === "archived") {
					// delete comment from editor if archived
					onDeleted?.();
				}
				invalidateQueries();
			},
		}),
	);

	const { mutate: deleteComment, isPending: isDeleting } = useMutation(
		trpc.tasks.deleteComment.mutationOptions({
			onSettled: () => {
				invalidateQueries();
				onDeleted?.();
			},
		}),
	);

	const handleStartEdit = () => {
		setIsEditing(true);
		setEditText(comment);
		onEditingChange?.(true);
	};

	const handleSubmitEdit = () => {
		updateComment({
			id: activity.id,
			comment: editText,
			taskId,
		});
		setIsEditing(false);
		setEditText("");
		onEditingChange?.(false);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditText("");
		onEditingChange?.(false);
	};

	const handleDelete = () => {
		deleteComment({ id: activity.id });
	};

	return (
		<div className="group/comment">
			<div className="mb-1 flex items-center gap-2">
				<AssigneeAvatar
					{...activity.user}
					className={compact ? "size-4" : "size-5"}
				/>
				<span className="text-muted-foreground text-xs">
					{formatRelative(new Date(activity.createdAt!), new Date())}
				</span>
				{isOwner && (
					<div className="ml-auto flex items-center gap-2 text-muted-foreground text-xs opacity-0 transition-opacity group-hover/comment:opacity-100">
						<button
							type="button"
							className="transition-colors hover:text-foreground"
							title="Resolve"
							onClick={() => {
								updateComment({
									id: activity.id,
									status: "archived",
									taskId,
								});
							}}
							disabled={isPending}
						>
							{isPending ? (
								<Loader className="size-4" />
							) : (
								<CheckIcon className="size-4" />
							)}
						</button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button type="button" className="hover:text-foreground">
									<EllipsisVerticalIcon className="size-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onSelect={handleStartEdit}>
									<PencilIcon />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onSelect={handleDelete}
									variant="destructive"
									disabled={isDeleting}
								>
									<TrashIcon />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</div>
			{isEditing ? (
				<div className="flex flex-col gap-1">
					<Editor
						value={editText}
						onChange={(val) => setEditText(val)}
						className="rounded-sm border border-input p-1"
						autoFocus
					/>
					<div className="ml-auto flex items-center gap-2">
						<Button
							className="size-5 rounded-full p-0!"
							onClick={handleSubmitEdit}
						>
							<CheckIcon />
						</Button>
						<Button
							variant="ghost"
							className="size-5 rounded-full p-0!"
							onClick={handleCancelEdit}
						>
							<XIcon />
						</Button>
					</div>
				</div>
			) : (
				<Response>{comment}</Response>
			)}
		</div>
	);
};
