import { Suspense } from "react";
import { StatusesList } from "./statuses-list";

export default function Page() {
	return (
		<div>
			<Suspense>
				<StatusesList />
			</Suspense>
		</div>
	);
}
