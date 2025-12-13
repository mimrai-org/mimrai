import { Alert, AlertDescription } from "@ui/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Suspense } from "react";

export default function Page() {
	return (
		<div className="py-4">
			<Suspense>
				<div className="px-4">
					<Alert className="mb-4">
						<InfoIcon />
						<AlertDescription>
							This is a beta version of the workstation. It's under active
							development. Some features may be missing or incomplete.
						</AlertDescription>
					</Alert>
				</div>
			</Suspense>
		</div>
	);
}
