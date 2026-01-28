import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { ApiKeysList } from "./api-keys-list";

export default function ApiKeysPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center p-8">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<ApiKeysList />
		</Suspense>
	);
}
