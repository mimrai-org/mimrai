import type { RouterOutputs } from "@api/trpc/routers";
import { Button } from "@ui/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { CircleQuestionMarkIcon, SparklesIcon } from "lucide-react";
import { useZenMode } from "./use-zen-mode";

type Task = RouterOutputs["tasks"]["get"]["data"][number];

export const ZenModeWhyButton = () => {
	const { currentTask: task } = useZenMode();
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={"ghost"}
					className="rounded-full text-xs opacity-70 sm:text-sm"
					size={"sm"}
				>
					<CircleQuestionMarkIcon />
					Why focus on this?
				</Button>
			</PopoverTrigger>
			<PopoverContent className="sm:w-128">
				<div className="flex gap-2 text-sm">
					<div>
						<SparklesIcon className="size-4" />
					</div>
					{task.focusReason || "No reason provided."}
				</div>
			</PopoverContent>
		</Popover>
	);
};
