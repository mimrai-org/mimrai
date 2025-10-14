import { useQuery } from "@tanstack/react-query";
import { Layers2Icon, Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useDebounceValue } from "usehooks-ts";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTaskParams } from "@/hooks/use-task-params";
import { queryClient, trpc } from "@/utils/trpc";

export const TaskDuplicated = ({ title }: { title?: string }) => {
	const { setParams } = useTaskParams();
	const [debouncedTitle] = useDebounceValue(title, 1000);

	const {
		data: duplicates,
		refetch: refetchDuplicates,
		isRefetching,
	} = useQuery(
		trpc.tasks.getDuplicates.queryOptions(
			{
				title: debouncedTitle!,
			},
			{
				enabled: false,
				placeholderData: (prev) => prev,
			},
		),
	);

	useEffect(() => {
		if (debouncedTitle && debouncedTitle.length >= 3) {
			refetchDuplicates();
		} else {
			queryClient.setQueryData(
				trpc.tasks.getDuplicates.queryKey({ title: debouncedTitle! }),
				[],
			);
		}
	}, [debouncedTitle]);

	return (
		<>
			{isRefetching ? (
				<div className="flex items-center space-x-1 text-muted-foreground text-sm">
					<Loader2Icon className="size-4 animate-spin" />
					<span>Looking for similar tasks...</span>
				</div>
			) : duplicates && duplicates.length > 0 ? (
				<Popover>
					<PopoverTrigger>
						<div className="flex cursor-pointer items-center space-x-1 text-muted-foreground text-sm transition-colors hover:text-primary">
							{isRefetching ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								<Layers2Icon className="size-4" />
							)}
							<span>Found {duplicates?.length || 0} similar tasks.</span>
						</div>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-[400px] p-2">
						<ScrollArea className="max-h-60">
							<div className="flex flex-col">
								{duplicates?.map((task) => (
									<button
										key={task.id}
										className="flex w-full justify-between border-b px-4 py-2 text-left text-sm last:border-0 hover:bg-accent/50"
										type="button"
										onClick={() => {
											setParams({ taskId: task.id });
										}}
									>
										<span>{task.title}</span>
										<span className="text-muted-foreground">
											{task?.score > 0.9
												? " (exact match)"
												: task?.score > 0.8
													? " (very similar)"
													: task?.score > 0.3
														? " (similar)"
														: ""}
										</span>
									</button>
								))}
							</div>
						</ScrollArea>
					</PopoverContent>
				</Popover>
			) : (
				<span />
			)}
		</>
	);
};
