import { TasksBurnupWidget } from "@/components/widgets/tasks-burnup-widget";
import { TasksByStatusWidget } from "@/components/widgets/tasks-by-status-widget";
import { TasksCompletionRate } from "@/components/widgets/tasks-completion-rate-widget";
import { TasksTodoWidget } from "@/components/widgets/tasks-todo-widget";

export default function Page() {
	return (
		<div className="flex flex-col gap-8 p-4">
			<div className="w-full">
				<TasksBurnupWidget />
			</div>
			<div className="grid w-full grid-cols-1 items-stretch gap-6 md:grid-cols-4">
				<TasksByStatusWidget />
				<TasksCompletionRate />
				<TasksTodoWidget className="md:col-span-2" />
			</div>
		</div>
	);
}
