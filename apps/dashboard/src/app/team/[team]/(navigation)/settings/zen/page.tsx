import { trpcClient } from "@/utils/trpc";
import { FocusGuardForm } from "./focus-guard-form";

export default async function Page() {
	const settings = await trpcClient.zen.getSettings.query();

	return (
		<div className="space-y-8">
			<FocusGuardForm defaultValues={settings.settings?.focusGuard} />
		</div>
	);
}
