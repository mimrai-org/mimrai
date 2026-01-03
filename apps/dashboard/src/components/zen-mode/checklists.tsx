import { useMutation, useQuery } from "@tanstack/react-query";
import { Checkbox } from "@ui/components/ui/checkbox";
import { Switch } from "@ui/components/ui/switch";
import { cn } from "@ui/lib/utils";
import { CircleCheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import { Response } from "../chat/response";
import { useZenMode } from "./use-zen-mode";

export const ZenModeChecklist = () => {
	const [showAll, setShowAll] = useState(false);
	const user = useUser();
	const { currentTask: task } = useZenMode();
	const { data: checklist } = useQuery(
		trpc.checklists.get.queryOptions({
			taskId: task.id,
		}),
	);

	const filteredChecklist = useMemo(() => {
		if (!checklist) return [];
		if (!user?.id) return [];
		if (showAll) {
			return checklist;
		}
		return checklist?.filter(
			(item) => item.assigneeId === user.id || !item.assigneeId,
		);
	}, [checklist, showAll, user?.id]);

	const { mutate: updateChecklistItem } = useMutation(
		trpc.checklists.update.mutationOptions(),
	);

	if (!checklist || checklist?.length === 0) {
		return null;
	}

	// const completed = checklist.filter((item) => item.isCompleted).length;
	// const total = checklist.length;

	return (
		<div className="w-full space-y-4 rounded-md p-4">
			<div className="flex w-full justify-between">
				<h2 className="flex items-center gap-2 font-medium text-sm uppercase">
					<CircleCheckIcon className="size-4" />
					Checklist
				</h2>
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					Show All
					<Switch checked={showAll} onCheckedChange={setShowAll} />
				</div>
			</div>
			<ul>
				{filteredChecklist.map((item, index) => (
					<li
						key={item.id}
						className="flex flex-col items-start gap-2 rounded-md px-3 py-2 transition-colors hover:bg-accent"
					>
						<div className="flex items-start gap-2">
							<Checkbox
								checked={item.isCompleted}
								className="mt-1"
								onCheckedChange={(v) => {
									updateChecklistItem({
										id: item.id,
										isCompleted: v as boolean,
									});
									queryClient.setQueryData(
										trpc.checklists.get.queryKey({ taskId: task.id }),
										(old) => {
											if (!old) return old;
											return old.map((checklistItem) => {
												if (checklistItem.id === item.id) {
													return {
														...checklistItem,
														isCompleted: v as boolean,
													};
												}
												return checklistItem;
											});
										},
									);
								}}
								id={item.id}
							/>
							<div>
								<label
									htmlFor={item.id}
									className={cn(
										"flex-1 cursor-pointer select-none font-light",
										{
											"text-muted-foreground line-through": item.isCompleted,
										},
									)}
								>
									<Response>{item.description}</Response>
								</label>

								{showAll && item.assignee && (
									<div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
										Assigned to{" "}
										<AssigneeAvatar {...item.assignee} className="size-5" />
									</div>
								)}
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};
