import { Suspense } from "react";
import { LabelList } from "./label-list";

export default function Page() {
	return (
		<div>
			<Suspense>
				<LabelList />
			</Suspense>
		</div>
	);
}
