import { Suspense } from "react";
import { IntegrationsList } from "./integrations-list";

export default function Page() {
	return (
		<div>
		<Suspense>
			<IntegrationsList />
		</Suspense>
		</div>
	);
}
