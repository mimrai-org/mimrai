import { Suspense } from "react";
import { TasksView } from "@/components/tasks-view/tasks-view";

type Props = {
	searchParams: Promise<{
		chatId?: string;
	}>;
};

export default function DashboardPage({ searchParams }: Props) {
	return (
		<div className="flex h-full flex-row gap-6">
			<div className="h-full w-full overflow-hidden">
				<Suspense>
					<TasksView
						// default value
						viewType="board"
						statusType={["to_do", "in_progress", "review", "done"]}
						showEmptyColumns={true}
					/>
				</Suspense>
			</div>
		</div>
	);
}
