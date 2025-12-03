import { Button } from "@ui/components/ui/button";
import { ListPlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { TaskContextMenu } from "../kanban/task-context-menu";
import Loader from "../loader";
import { TaskItem } from "./task-item";
import { useTasksViewContext } from "./tasks-view";

export const TasksList = () => {
	const { tasks, fetchNextPage, hasNextPage, isLoading } =
		useTasksViewContext();

	return (
		<AnimatePresence mode="popLayout">
			<ul className="flex flex-col gap-2 py-4">
				{tasks.map((task) => (
					<TaskContextMenu key={task.id} task={task}>
						<li>
							<TaskItem task={task} />
						</li>
					</TaskContextMenu>
				))}

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
			</ul>
		</AnimatePresence>
	);
};
