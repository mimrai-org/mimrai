import { Suspense } from "react";
import { TeamDelete } from "./team-delete";
import { TeamSettings } from "./team-settings";

export default function Page() {
	return (
		<div className="space-y-6">
			<Suspense>
				<TeamSettings />
			</Suspense>
			<TeamDelete />
		</div>
	);
}
