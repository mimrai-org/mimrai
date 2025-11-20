import { TasksBurnupWidget } from "@/components/widgets/tasks-burnup-widget";
import { TasksTodoWidget } from "@/components/widgets/tasks-todo-widget";

export default function Page() {
	return (
		<div className="flex flex-col gap-8">
			<div className="w-full">
				<TasksBurnupWidget />
			</div>
			<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
				<div className="md:col-span-3">
					<TasksTodoWidget />
				</div>
			</div>
		</div>
	);
}
