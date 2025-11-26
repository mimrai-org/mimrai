"use client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import {
	CopyIcon,
	CopyPlusIcon,
	EllipsisVerticalIcon,
	ShareIcon,
	TrashIcon,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { useShareableParams } from "@/hooks/use-shareable-params";
import { useTaskParams } from "@/hooks/use-task-params";
import { queryClient, trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form-type";

export const ActionsMenu = () => {
	const { setParams } = useTaskParams();
	const { setParams: setShareableParams } = useShareableParams();
	const form = useFormContext<TaskFormValues>();

	const { mutate: deleteTask, isPending: isDeleting } = useMutation(
		trpc.tasks.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting task...", {
					id: "deleting-task",
				});
			},
			onSuccess: () => {
				toast.success("Task deleted", {
					id: "deleting-task",
				});
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				setParams(null);
			},
			onError: () => {
				toast.error("Failed to delete task", {
					id: "deleting-task",
				});
			},
		}),
	);

	const { mutate: cloneTask, isPending: isCloning } = useMutation(
		trpc.tasks.clone.mutationOptions({
			onMutate: () => {
				toast.loading("Cloning task...", {
					id: "cloning-task",
				});
			},
			onSuccess: (task) => {
				toast.success("Task cloned", {
					id: "cloning-task",
				});
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				setParams({ taskId: task.id });
			},
			onError: () => {
				toast.error("Failed to clone task", {
					id: "cloning-task",
				});
			},
		}),
	);

	const handleClone = () => {
		cloneTask({
			taskId: form.getValues().id!,
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant={"ghost"} size={"icon"}>
					<EllipsisVerticalIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem
					onClick={() => {
						handleClone();
					}}
					disabled={isCloning}
				>
					{isCloning ? <Loader /> : <CopyPlusIcon />}
					Clone
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => {
						setShareableParams({
							createShareable: true,
							shareableResourceId: form.getValues().id!,
							shareableResourceType: "task",
						});
					}}
				>
					<ShareIcon />
					Share
				</DropdownMenuItem>
				<DropdownMenuItem
					variant="destructive"
					disabled={isDeleting}
					onClick={() =>
						deleteTask({
							id: form.getValues().id!,
						})
					}
				>
					{isDeleting ? <Loader /> : <TrashIcon />}
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
