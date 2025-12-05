import { TasksSuggestions } from "../tasks-suggestions/tasks-suggestions";
import { ColumnCreateSheet } from "./column-create-sheet";
import { ColumnUpdateSheet } from "./column-update-sheet ";
import { IntegrationInstallSheet } from "./integration-install-sheet";
import { LabelCreateSheet } from "./label-create-sheet";
import { LabelUpdateSheet } from "./label-update-sheet";
import { MemberUpdateSheet } from "./member-update-sheet";
import { PlanSelectSheet } from "./plan-select-sheet";
import { ProjectCreateSheet } from "./project-create-sheet";
import { ProjectUpdateSheet } from "./project-update-sheet";
import { ShareableCreateSheet } from "./shareable-create-sheet.tsx";
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
			<ProjectCreateSheet />
			<ProjectUpdateSheet />
			<ShareableCreateSheet />
			<PlanSelectSheet />
			<TasksSuggestions />
		</>
	);
};
