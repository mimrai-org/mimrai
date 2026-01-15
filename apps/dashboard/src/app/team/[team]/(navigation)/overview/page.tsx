import { ActivityWidget } from "@/components/widgets/activity-widget";
import { SuggestionsWidget } from "@/components/widgets/suggestions-widget";
import { TasksBurnupWidget } from "@/components/widgets/tasks-burnup-widget";
import { TasksByStatusWidget } from "@/components/widgets/tasks-by-status-widget";
import { TasksTodoWidget } from "@/components/widgets/tasks-todo-widget";

export default function Page() {
	return (
		<div className="grid animate-blur-in gap-6 p-6 md:grid-cols-4">
			<div className="">
				<SuggestionsWidget />
			</div>
			<div className="col-span-2">
				<TasksBurnupWidget />
			</div>
			<ActivityWidget className="md:col-span-1 md:row-span-2" />
			<TasksByStatusWidget />
			<TasksTodoWidget className="md:col-span-2" />
		</div>
	);
}
