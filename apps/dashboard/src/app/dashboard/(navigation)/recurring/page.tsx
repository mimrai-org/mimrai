import { Suspense } from "react";
import { TasksView } from "@/components/tasks-view/tasks-view";

export default function Page() {
	return (
		<Suspense>
			<div className="h-full">
				<TasksView
					viewType={"list"}
					recurring={true}
					showEmptyColumns={false}
				/>
			</div>
		</Suspense>
	);
}
