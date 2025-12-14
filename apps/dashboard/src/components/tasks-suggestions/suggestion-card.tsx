import type { RouterOutputs } from "@api/trpc/routers";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import { formatRelative } from "date-fns";
import {
	CheckIcon,
	CircleDashedIcon,
	ExternalLinkIcon,
	EyeIcon,
	MessageSquareIcon,
	SparklesIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import type {
	AnimationGeneratorType,
	Easing,
	MotionStyle,
	Transition,
} from "motion/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useTaskParams } from "@/hooks/use-task-params";
import { queryClient, trpc } from "@/utils/trpc";
import Loader from "../loader";

export const suggestionIcon = {
	move: CircleDashedIcon,
	assign: UserIcon,
	comment: MessageSquareIcon,
};

const suggestionContainerVariant = {
	initial: { scale: 1 },
	hover: { scale: 1.02 },
	exit: { scale: 0 },
};

const suggestionActionsVariant = {
	initial: { height: 0, opacity: 0 },
	hover: { height: "auto", opacity: 1 },
};

const suggestionContentVariant = {
	initial: { height: "auto", width: "auto" },
	hover: { height: "auto", width: "auto" },
};

const transition = {
	type: "spring" as AnimationGeneratorType,
	ease: "easeInOut" as Easing,
	duration: 0.3,
	bounce: 0,
} satisfies Transition;

export const SuggestionCard = ({
	suggestion,
	className,
	style,
}: {
	suggestion: RouterOutputs["tasksSuggestions"]["get"][0];
	className?: string;
	style?: MotionStyle;
}) => {
	const { setParams: setTasksParams } = useTaskParams();
	const Icon = suggestionIcon[suggestion.payload.type];

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
					trpc.tasksSuggestions.get.queryKey(),
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
		<motion.div
			key={suggestion.id}
			variants={suggestionContainerVariant}
			initial="initial"
			exit={"exit"}
			transition={transition}
			layout
			whileHover={"hover"}
			className={cn("group pointer-events-auto", className)}
			style={style}
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
							{formatRelative(new Date(suggestion.createdAt!), new Date())}
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
				<div className="mt-4 flex gap-2">
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
							dismissSuggestion({
								id: suggestion.id,
							})
						}
					>
						{isDismissing ? <Loader /> : <XIcon />}
						Dismiss
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
						<ExternalLinkIcon />
					</Button>
				</div>
			</motion.div>
		</motion.div>
	);
};
