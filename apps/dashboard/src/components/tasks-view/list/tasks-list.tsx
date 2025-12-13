import { Button } from "@ui/components/ui/button";
import { ListPlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import Loader from "../../loader";
import { TaskContextMenu } from "../../task-context-menu";
import { useTasksGrouped } from "../tasks-group";
import { useTasksViewContext } from "../tasks-view";
import { TaskItem } from "./task-item";

export const TasksList = () => {
	const { fetchNextPage, hasNextPage, isLoading } = useTasksViewContext();

	const { tasks } = useTasksGrouped();

	return (
		<AnimatePresence mode="popLayout">
			<div className="flex flex-col gap-2 py-4">
				{Object.entries(tasks).map(([_, taskGroup]) => {
					return (
						<div key={taskGroup.column.id} className="flex flex-col gap-2">
							<h2 className="flex items-center gap-2 bg-card px-4 py-2 text-sm">
								{taskGroup.column.icon}
								{taskGroup.column.name}
								<span className="text-muted-foreground text-xs">
									{taskGroup.tasks.length}
								</span>
							</h2>
							{taskGroup.tasks.map((task) => (
								<TaskContextMenu key={task.id} task={task}>
									<div>
										<TaskItem task={task} />
									</div>
								</TaskContextMenu>
							))}
						</div>
					);
				})}

				{hasNextPage && (
					<li className="flex items-center justify-center">
						<Button
							type="button"
							size={"sm"}
							variant="ghost"
							disabled={isLoading}
							onClick={() => fetchNextPage()}
						>
							{isLoading ? <Loader /> : <ListPlusIcon />}
							Load more
						</Button>
					</li>
				)}
			</div>
		</AnimatePresence>
	);
};
