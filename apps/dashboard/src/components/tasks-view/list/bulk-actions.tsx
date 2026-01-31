import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Separator } from "@ui/components/ui/separator";
import { CheckIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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

					<BulkActionItem onClick={handleMarkAsDone} disabled={isPending}>
						{isPending ? <Loader /> : <CheckIcon />}
						<BulkActionItemLabel>Mark as Done</BulkActionItemLabel>
					</BulkActionItem>

					<BulkActionItem onClick={clearTaskSelection} disabled={isPending}>
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
};

const bulkActionItemLabelVariants = {
	hover: {
		opacity: 1,
		width: "auto",
	},
	initial: {
		opacity: 0,
		width: 0,
	},
};

const BulkActionItem = ({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) => {
	return (
		<motion.div
			initial="initial"
			whileHover="hover"
			variants={bulkActionItemVariants}
		>
			<Button
				onClick={onClick}
				variant="ghost"
				title="Clear selection"
				size="sm"
				disabled={disabled}
			>
				{children}
			</Button>
		</motion.div>
	);
};

const BulkActionItemLabel = ({ children }: { children: React.ReactNode }) => {
	return (
		<motion.span
			variants={bulkActionItemLabelVariants}
			className="overflow-hidden whitespace-nowrap font-normal text-muted-foreground text-xs"
		>
			{children}
		</motion.span>
	);
};
