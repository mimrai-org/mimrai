import { ColumnCreateSheet } from "./column-create-sheet";
import { ColumnUpdateSheet } from "./column-update-sheet ";
import { IntegrationInstallSheet } from "./integration-install-sheet";
import { LabelCreateSheet } from "./label-create-sheet";
import { LabelUpdateSheet } from "./label-update-sheet";
import { MemberUpdateSheet } from "./member-update-sheet";
import { TaskCreateSheet } from "./task-create-sheet";
import { TaskUpdateSheet } from "./task-update-sheet";
import { TeamCreateSheet } from "./team-create-sheet";

export const GlobalSheets = () => {
	return (
		<>
			<TaskCreateSheet />
			<MemberUpdateSheet />
			<ColumnCreateSheet />
			<ColumnUpdateSheet />
			<LabelCreateSheet />
			<LabelUpdateSheet />
			<TaskUpdateSheet />
			<TeamCreateSheet />
			<IntegrationInstallSheet />
		</>
	);
};
