"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	CheckIcon,
	CircleDashedIcon,
	MessageSquareIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { queryClient, trpc } from "@/utils/trpc";
import Loader from "../loader";

const suggestionContainerVariant = {
	initial: { x: 300 },
	hover: { x: 0 },
	exit: { x: "120%" },
};

const suggestionActionsVariant = {
	initial: { height: 0, opacity: 0 },
	hover: { height: "auto", opacity: 1, marginTop: 8 },
};

const suggestionContentVariant = {
	initial: { height: 38, width: 300 },
	hover: { height: "auto", width: "auto" },
};

export const TasksSuggestions = () => {
	const { data } = useQuery(
		trpc.tasksSuggestions.get.queryOptions({
			status: ["pending"],
			pageSize: 5,
		}),
	);

	const { mutate: acceptSuggestion, isPending: isAccepting } = useMutation(
		trpc.tasksSuggestions.accept.mutationOptions({
			onMutate: () => {
				toast.loading("Accepting suggestion...", {
					id: "accept-suggestion",
				});
			},
			onSuccess: (data) => {
				toast.success("Suggestion accepted!", { id: "accept-suggestion" });

				if (!data) return;

				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				queryClient.setQueryData(
					trpc.tasksSuggestions.get.queryKey({
						status: ["pending"],
						pageSize: 5,
					}),
					(oldData) => {
						return oldData?.filter((suggestion) => suggestion.id !== data?.id);
					},
				);
			},
			onError: () => {
				toast.error("Failed to accept suggestion.", {
					id: "accept-suggestion",
				});
			},
		}),
	);

	const { mutate: dismissSuggestion, isPending: isDismissing } = useMutation(
		trpc.tasksSuggestions.reject.mutationOptions({
			onMutate: () => {
				toast.loading("Dismissing suggestion...", {
					id: "dismiss-suggestion",
				});
			},
			onSuccess: (data) => {
				toast.success("Suggestion dismissed!", { id: "dismiss-suggestion" });

				if (!data) return;

				queryClient.setQueryData(
					trpc.tasksSuggestions.get.queryKey({
						status: ["pending"],
						pageSize: 5,
					}),
					(oldData) => {
						return oldData?.filter((suggestion) => suggestion.id !== data?.id);
					},
				);
			},
			onError: () => {
				toast.error("Failed to dismiss suggestion.", {
					id: "dismiss-suggestion",
				});
			},
		}),
	);

	const isLoading = isAccepting || isDismissing;

	return (
		<div className="pointer-events-none fixed right-0">
			<div className="flex w-[400px] flex-col gap-4 text-sm">
				<AnimatePresence mode="popLayout">
					{data?.map((suggestion) => {
						const Icon = suggestionIcon[suggestion.payload.type];
						return (
							<motion.div
								key={suggestion.id}
								variants={suggestionContainerVariant}
								initial="initial"
								exit={"exit"}
								layout
								whileHover={"hover"}
								className="group pointer-events-auto border bg-background/50 p-4 backdrop-blur-xl"
							>
								<div className="flex items-center gap-4">
									<div>
										<Icon className="size-4 text-muted-foreground" />
									</div>
									<motion.div
										variants={suggestionContentVariant}
										className="flex-1 overflow-hidden text-ellipsis"
									>
										{suggestion.content}
									</motion.div>
								</div>
								<motion.div
									variants={suggestionActionsVariant}
									className="flex justify-end gap-2 overflow-hidden"
								>
									<Button
										size="sm"
										disabled={isLoading}
										onClick={() =>
											acceptSuggestion({
												id: suggestion.id,
											})
										}
									>
										{isAccepting ? <Loader /> : <CheckIcon />}
										Accept
									</Button>
									<Button
										variant="outline"
										disabled={isLoading}
										size="sm"
										onClick={() =>
											dismissSuggestion({
												id: suggestion.id,
											})
										}
									>
										{isDismissing ? <Loader /> : <XIcon />}
										Dismiss
									</Button>
								</motion.div>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
};

export const suggestionIcon = {
	move: CircleDashedIcon,
	assign: UserIcon,
	comment: MessageSquareIcon,
};
