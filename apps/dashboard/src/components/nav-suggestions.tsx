import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import { LightbulbIcon } from "lucide-react";
import { useTaskSuggestionsParams } from "@/hooks/use-tasks-suggestions-params";
import { trpc } from "@/utils/trpc";

export const NavSuggestions = () => {
	const { setParams, showTaskSuggestions } = useTaskSuggestionsParams();
	const { data } = useQuery(
		trpc.tasksSuggestions.get.queryOptions({
			pageSize: 1,
			status: ["pending"],
		}),
	);

	return (
		<Button
			size={"sm"}
			className={cn("relative size-8 rounded-full", {
				"bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground dark:hover:bg-primary/80 dark:hover:text-primary-foreground":
					showTaskSuggestions,
			})}
			type="button"
			variant={"ghost"}
			onClick={() => setParams({ showTaskSuggestions: !showTaskSuggestions })}
		>
			<LightbulbIcon />
			{data && data.length > 0 && (
				<div className="absolute top-0 right-0 size-2 rounded-full bg-primary" />
			)}
		</Button>
	);
};
