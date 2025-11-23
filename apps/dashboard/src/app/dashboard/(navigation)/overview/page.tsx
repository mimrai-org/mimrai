import { TasksBurnupWidget } from "@/components/widgets/tasks-burnup-widget";
import { TasksByColumnWidget } from "@/components/widgets/tasks-by-column-widget";
import { TasksTodoWidget } from "@/components/widgets/tasks-todo-widget";

export default function Page() {
	return (
		<div className="flex flex-col gap-8">
			<div className="w-full">
				<TasksBurnupWidget />
			</div>
			<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-4">
				<div className="h-full">
					<TasksByColumnWidget />
				</div>
				<div className="h-full md:col-span-3">
					<TasksTodoWidget />
				</div>
			</div>
		</div>
	);
}
