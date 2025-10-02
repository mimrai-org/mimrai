import { ColumnCreateSheet } from "./column-create-sheet";
import { IntegrationInstallSheet } from "./integration-install-sheet";
import { TaskCreateSheet } from "./task-create-sheet";
import { TaskUpdateSheet } from "./task-update-sheet";
import { TeamCreateSheet } from "./team-create-sheet";

export const GlobalSheets = () => {
	return (
		<>
			<TaskCreateSheet />
			<ColumnCreateSheet />
			<TaskUpdateSheet />
			<TeamCreateSheet />
			<IntegrationInstallSheet />
		</>
	);
};
