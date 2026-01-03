import { Button } from "@ui/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { CircleQuestionMarkIcon, SparklesIcon } from "lucide-react";
import { useZenMode } from "./use-zen-mode";

export const ZenModeWhyButton = () => {
	const { currentTask: task } = useZenMode();

	if (!task.focusReason) {
		return null;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant={"ghost"}
					className="rounded-full text-xs opacity-70 sm:text-sm"
					size={"sm"}
				>
					<CircleQuestionMarkIcon />
					Why focus on this?
				</Button>
			</TooltipTrigger>
			<TooltipContent className="sm:max-w-92" side="bottom">
				<div className="flex gap-2 text-sm">
					<div>
						<SparklesIcon className="size-4" />
					</div>
					{task.focusReason}
				</div>
			</TooltipContent>
		</Tooltip>
	);
};
