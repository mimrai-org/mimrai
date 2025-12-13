import type { RouterOutputs } from "@api/trpc/routers";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from "@ui/components/ui/dialog";
import { CheckIcon, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import { StatusIcon } from "../status-icon";
import type { ZenModeTask } from "./view";

export const ZenModeDoneButton = ({
	task,
	handleNext,
}: {
	task: ZenModeTask;
	handleNext: () => void;
}) => {
	const router = useRouter();
	const user = useUser();
	const [dialogOpen, setDialogOpen] = useState(false);

	const { data: statuses } = useQuery(
		trpc.statuses.get.queryOptions({
			type: ["review", "done", "in_progress", "to_do", "backlog"],
		}),
	);

	const sortedStatuses = statuses?.data?.sort((a, b) => {
		const order = {
			done: 0,
			review: 1,
			in_progress: 2,
			to_do: 3,
			backlog: 4,
		};
		return order[a.type] - order[b.type];
	});

	const { mutate: updateTask, isPending } = useMutation(
		trpc.tasks.update.mutationOptions({
			onMutate: () => {
				handleNext();
			},
		}),
	);

	const handleExit = useCallback(() => {
		if (dialogOpen) {
			setDialogOpen(false);
			return;
		}
		router.push(`${user?.basePath}/board`);
	}, [dialogOpen, router, user]);

	useHotkeys(
		"esc",
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			handleExit();
		},
		[dialogOpen],
	);

	useHotkeys("command+enter,ctrl+enter", (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDialogOpen(true);
	});

	return (
		<>
			<Button
				variant={"default"}
				className="rounded-full text-sm shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 sm:text-base"
				size={"xl"}
				disabled={isPending}
				type="button"
				onClick={(e) => {
					setDialogOpen(true);
				}}
			>
				<CheckIcon />
				Mark as Done
			</Button>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent
					showCloseButton={false}
					className="top-auto bottom-4 rounded-xl"
					onKeyDown={(e) => {
						// prevent close with esc
						e.stopPropagation();
					}}
				>
					<DialogHeader>
						<DialogTitle>Task Completed!</DialogTitle>
						<DialogDescription>
							Where should we move "{task.title}"?
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						{sortedStatuses?.map((status, index) => (
							<Button
								key={status.id}
								type="button"
								variant={"secondary"}
								className="group h-14 w-full justify-start rounded-md"
								onClick={() => {
									updateTask({
										id: task.id,
										statusId: status.id,
									});
									setDialogOpen(false);
								}}
								onKeyDown={(e) => {
									// move to the status on number key press
									const key = e.key;
									if (key >= "1" && key <= String(sortedStatuses.length)) {
										const colIndex = Number.parseInt(key, 10) - 1;
										if (sortedStatuses[colIndex]) {
											updateTask({
												id: task.id,
												statusId: sortedStatuses[colIndex].id,
											});
											setDialogOpen(false);
										}
									}
								}}
							>
								<StatusIcon {...status} className="size-4" />
								<div className="ml-2 flex flex-col items-start">
									{status.name}
									<span className="text-muted-foreground text-xs">
										{status.type === "done" && "This task is completed"}
										{status.type === "review" && "This task needs review"}
										{status.type === "in_progress" && "Just update the status"}
										{status.type === "to_do" && "This task is not started yet"}
										{status.type === "backlog" &&
											"This task is moved to backlog"}
									</span>
								</div>
								<span className="ml-auto flex items-center gap-1 text-muted-foreground">
									<span className="ml-2 flex items-center gap-1 text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
										Move to this status
									</span>
									<div className="h-fit rounded-md bg-background px-2 py-1 font-mono text-xs">
										{index + 1}
									</div>
								</span>
							</Button>
						))}

						<Button
							variant={"ghost"}
							className="mx-auto mt-2 w-fit justify-center text-muted-foreground text-xs"
							onClick={() => {
								setDialogOpen(false);
							}}
						>
							Cancel
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
