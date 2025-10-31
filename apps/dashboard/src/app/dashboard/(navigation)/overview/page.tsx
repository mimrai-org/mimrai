import { TasksCompletedByDay } from "@/components/widgets/tasks-completed-by-day";
import { TasksCompletedByMember } from "@/components/widgets/tasks-completed-by-member";

export default function Page() {
	return (
		<div className="flex flex-col gap-8 p-6">
			<div className="w-full">
				<TasksCompletedByDay />
			</div>
			<div className="grid w-full grid-cols-4 gap-6">
				<TasksCompletedByMember />
			</div>
		</div>
	);
}
