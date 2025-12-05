"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { formatRelative } from "date-fns";
import {
	CheckIcon,
	CircleDashedIcon,
	EyeIcon,
	MessageSquareIcon,
	SparklesIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import {
	AnimatePresence,
	type AnimationGeneratorType,
	type Easing,
	motion,
	type Transition,
} from "motion/react";
import { toast } from "sonner";
import { useTaskParams } from "@/hooks/use-task-params";
import { useTaskSuggestionsParams } from "@/hooks/use-tasks-suggestions-params";
import { queryClient, trpc } from "@/utils/trpc";
import Loader from "../loader";

const suggestionContainerVariant = {
	initial: { x: 100 },
	hover: { x: 4 },
	exit: { x: "120%" },
};

const suggestionActionsVariant = {
	initial: { height: 0, opacity: 0 },
	hover: { height: "auto", opacity: 1, marginTop: 12 },
};

const suggestionContentVariant = {
	initial: { height: "auto", width: 300 },
	hover: { height: "auto", width: "auto" },
};

const transition = {
	type: "spring" as AnimationGeneratorType,
	ease: "easeInOut" as Easing,
	duration: 0.3,
	bounce: 0,
} satisfies Transition;

export const TasksSuggestions = () => {
	const { showTaskSuggestions, setParams } = useTaskSuggestionsParams();
	const { setParams: setTasksParams } = useTaskParams();

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
						return oldData?.filter(
							(suggestion) => !data.find((s) => s.id === suggestion.id),
						);
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
		<AnimatePresence>
			{showTaskSuggestions && (
				<motion.div
					initial={{
						right: -500,
					}}
					animate={{
						right: 12,
					}}
					exit={{
						right: -500,
					}}
					transition={{
						type: "spring",
						duration: 0.4,
						bounce: 0.2,
					}}
					className="pointer-events-none fixed top-[100px] right-0 z-60"
				>
					<div className="flex w-[400px] flex-col gap-4 text-sm">
						<div className="pointer-events-auto ml-auto flex w-fit justify-end gap-4 rounded-sm bg-background p-4">
							{data && data.length > 1 && (
								<button
									type="button"
									className="flex items-center text-muted-foreground text-xs hover:text-foreground"
									onClick={() => {
										dismissSuggestion({});
									}}
								>
									Dismiss all
								</button>
							)}
							<button
								type="button"
								className="flex items-center text-muted-foreground text-xs hover:text-foreground"
								onClick={() => setParams({ showTaskSuggestions: false })}
							>
								<XIcon className="mr-1 inline-block size-3" />
								Close
							</button>
						</div>

						{data && data.length === 0 && (
							<div className="pointer-events-auto w-fit self-end rounded-sm border bg-background/50 p-4 text-center text-muted-foreground text-sm backdrop-blur-xl">
								No task suggestions available
							</div>
						)}
						<AnimatePresence mode="popLayout">
							{data?.map((suggestion) => {
								const Icon = suggestionIcon[suggestion.payload.type];
								return (
									<motion.div
										key={suggestion.id}
										variants={suggestionContainerVariant}
										initial="initial"
										exit={"exit"}
										transition={transition}
										layout
										whileHover={"hover"}
										className="group pointer-events-auto rounded-sm border bg-background/50 p-4 backdrop-blur-xl"
									>
										<div className="flex items-center gap-4">
											<div>
												<Icon className="size-4 text-muted-foreground" />
											</div>
											<motion.div
												variants={suggestionContentVariant}
												className="flex-1 overflow-hidden text-ellipsis"
											>
												<div className="mb-2">
													<span className="text-muted-foreground text-xs">
														<SparklesIcon className="mr-2 inline-block size-3" />
														Suggested{" "}
														{formatRelative(
															new Date(suggestion.createdAt!),
															new Date(),
														)}
													</span>
												</div>
												{suggestion.content}
											</motion.div>
										</div>
										<motion.div
											variants={suggestionActionsVariant}
											transition={transition}
											className="flex items-end justify-end gap-2 overflow-hidden"
										>
											<div className="flex gap-2">
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
													variant="ghost"
													disabled={isLoading}
													size="sm"
													onClick={() =>
														setTasksParams({
															taskId: suggestion.taskId,
														})
													}
												>
													<EyeIcon />
													View Task
												</Button>
												<Button
													variant="ghost"
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
											</div>
										</motion.div>
									</motion.div>
								);
							})}
						</AnimatePresence>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export const suggestionIcon = {
	move: CircleDashedIcon,
	assign: UserIcon,
	comment: MessageSquareIcon,
};
