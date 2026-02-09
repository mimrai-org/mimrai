import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, buttonVariants } from "@ui/components/ui/button";
import { Separator } from "@ui/components/ui/separator";
import { cn } from "@ui/lib/utils";
import { he, vi } from "date-fns/locale";
import { CheckIcon, Trash2Icon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import Loader from "@/components/loader";
import { useTaskSelectionStore } from "@/store/task-selection";
import { queryClient, trpc } from "@/utils/trpc";

export const TaskListBulkActions = () => {
	const selectedTaskIds = useTaskSelectionStore(
		(state) => state.selectedTaskIds,
	);
	const clearTaskSelection = useTaskSelectionStore(
		(state) => state.clearTaskSelection,
	);

	const { data: statuses } = useQuery(
		trpc.statuses.get.queryOptions({
			type: ["done"],
		}),
	);

	const { mutate: bulkUpdate, isPending } = useMutation(
		trpc.tasks.bulkUpdate.mutationOptions({
			onSuccess: () => {
				clearTaskSelection();
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			},
		}),
	);

	const { mutate: bulkDelete, isPending: isDeleting } = useMutation(
		trpc.tasks.bulkDelete.mutationOptions({
			onSuccess: () => {
				clearTaskSelection();
				setConfirmDelete(false);
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			},
		}),
	);

	const [confirmDelete, setConfirmDelete] = useState(false);

	const handleBulkDelete = () => {
		if (!confirmDelete) {
			setConfirmDelete(true);
			return;
		}
		bulkDelete({ ids: selectedTaskIds });
	};

	const handleMarkAsDone = () => {
		if (!statuses?.data || statuses?.data.length === 0) return;
		const statusId = statuses.data[0].id;

		bulkUpdate({
			ids: selectedTaskIds,
			statusId,
		});
	};

	return (
		<AnimatePresence mode="sync">
			{selectedTaskIds.length > 0 && (
				<motion.div
					animate={{ opacity: 1, scale: 1 }}
					initial={{ opacity: 0, scale: 0.8 }}
					exit={{ opacity: 0, scale: 0.8 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-x-0 bottom-4 mx-auto flex w-fit items-center gap-2 rounded-sm border bg-background px-2 py-1 shadow-lg shadow-secondary/50"
				>
					<div className="px-2 font-light text-muted-foreground text-xs">
						{selectedTaskIds.length} Tasks
					</div>
					<Separator orientation="vertical" className="min-h-6" />

					<BulkActionItem
						onClick={handleMarkAsDone}
						disabled={isPending || isDeleting}
					>
						{isPending ? <Loader /> : <CheckIcon />}
						<BulkActionItemLabel>Mark as Done</BulkActionItemLabel>
					</BulkActionItem>

					<BulkActionItem
						onClick={handleBulkDelete}
						disabled={isPending || isDeleting}
						variant={confirmDelete ? "destructive" : "ghost"}
					>
						{isDeleting ? <Loader /> : <Trash2Icon />}
						<BulkActionItemLabel>
							{confirmDelete ? "Confirm?" : "Delete"}
						</BulkActionItemLabel>
					</BulkActionItem>

					<BulkActionItem
						onClick={() => {
							clearTaskSelection();
							setConfirmDelete(false);
						}}
						disabled={isPending || isDeleting}
					>
						<XIcon />
						<BulkActionItemLabel>Clear</BulkActionItemLabel>
					</BulkActionItem>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

const bulkActionItemVariants = {
	hover: {},
	initial: {},
};

const bulkActionItemLabelVariants = {
	hover: {
		opacity: 1,
		marginLeft: 4,
		width: "auto",
	},
	initial: {
		opacity: 0,
		marginLeft: 0,
		width: 0,
	},
};

const BulkActionItem = ({
	children,
	onClick,
	disabled,
	variant = "ghost",
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	variant?: "ghost" | "destructive";
}) => {
	return (
		<motion.button
			initial="initial"
			whileHover="hover"
			variants={bulkActionItemVariants}
			className={cn(
				buttonVariants({ variant, size: "sm" }),
				"flex items-center gap-0!",
			)}
			onClick={onClick}
			title="Clear selection"
			disabled={disabled}
		>
			{children}
		</motion.button>
	);
};

const BulkActionItemLabel = ({ children }: { children: React.ReactNode }) => {
	return (
		<motion.span
			variants={bulkActionItemLabelVariants}
			className="overflow-hidden whitespace-nowrap font-normal text-current text-xs"
		>
			{children}
		</motion.span>
	);
};
