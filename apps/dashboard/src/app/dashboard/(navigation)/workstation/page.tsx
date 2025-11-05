import { Suspense } from "react";
import { WorkstationList } from "./workstation-list";

export default function Page() {
	return (
		<Suspense>
			<WorkstationList />
		</Suspense>
	);
}
