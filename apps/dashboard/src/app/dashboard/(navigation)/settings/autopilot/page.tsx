import { AutopilotSettings } from "./autopilot-settings";
import { EnableAutopilotSettings } from "./enable-autopilot-settings";

export default function Page() {
	return (
		<div className="space-y-4">
			<EnableAutopilotSettings />
			<AutopilotSettings />
		</div>
	);
}
