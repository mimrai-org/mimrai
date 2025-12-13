import { Suspense } from "react";
import { TasksView } from "@/components/tasks-view/tasks-view";

export default function Page() {
	return (
		<Suspense>
			<TasksView
				viewType={"list"}
				statusType={["done"]}
				showEmptyColumns={false}
			/>
		</Suspense>
	);
}
