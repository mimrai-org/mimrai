"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import { XIcon } from "lucide-react";
import {
	AnimatePresence,
	type AnimationGeneratorType,
	type Easing,
	motion,
	type Transition,
} from "motion/react";
import { toast } from "sonner";
import { useTaskSuggestionsParams } from "@/hooks/use-tasks-suggestions-params";
import { queryClient, trpc } from "@/utils/trpc";
import { SuggestionCard } from "./suggestion-card";

const suggestionContainerVariant = {
	initial: { x: 100 },
	hover: { x: 4 },
	exit: { x: "120%" },
};

const transition = {
	type: "spring" as AnimationGeneratorType,
	ease: "easeInOut" as Easing,
	duration: 0.3,
	bounce: 0,
} satisfies Transition;

export const TasksSuggestions = () => {
	const { showTaskSuggestions, setParams } = useTaskSuggestionsParams();

	const { data } = useQuery(
		trpc.tasksSuggestions.get.queryOptions({
			status: ["pending"],
			pageSize: 5,
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
					trpc.tasksSuggestions.get.queryKey(),
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
								return (
									<motion.div
										variants={suggestionContainerVariant}
										initial="initial"
										exit={"exit"}
										transition={transition}
										layout
										whileHover={"hover"}
										className={cn(
											"group pointer-events-auto rounded-sm border bg-background/50 p-4 backdrop-blur-xl",
										)}
										key={suggestion.id}
									>
										<SuggestionCard suggestion={suggestion} />
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
