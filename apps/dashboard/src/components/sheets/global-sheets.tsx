import { TasksSuggestions } from "../tasks-suggestions/tasks-suggestions";
import { IntegrationInstallSheet } from "./integration-install-sheet";
import { LabelCreateSheet } from "./label-create-sheet";
import { LabelUpdateSheet } from "./label-update-sheet";
import { MemberUpdateSheet } from "./member-update-sheet";
import { PlanSelectSheet } from "./plan-select-sheet";
import { ProjectCreateSheet } from "./project-create-sheet";
import { ProjectHealthUpdateDialog } from "./project-health-update-dialog";
import { ProjectUpdateSheet } from "./project-update-sheet";
import { ShareableCreateSheet } from "./shareable-create-sheet.tsx";
import { StatusCreateSheet } from "./status-create-sheet";
import { StatusUpdateSheet } from "./status-update-sheet ";
import { TaskCreateSheet } from "./task-create-sheet";
import { TaskDependencyDialog } from "./task-dependency-dialog";
import { TaskUpdateSheet } from "./task-update-sheet";
import { TaskViewCreateSheet } from "./task-view-create-sheet";
import { TaskViewUpdateSheet } from "./task-view-update-sheet";
import { TeamCreateSheet } from "./team-create-sheet";

export const GlobalSheets = () => {
	return (
		<>
			<TaskCreateSheet />
			<MemberUpdateSheet />
			<StatusCreateSheet />
			<StatusUpdateSheet />
			<LabelCreateSheet />
			<LabelUpdateSheet />
			<TaskUpdateSheet />
			<TeamCreateSheet />
			<IntegrationInstallSheet />
			<ProjectCreateSheet />
			<ProjectUpdateSheet />
			<ProjectHealthUpdateDialog />
			<ShareableCreateSheet />
			<PlanSelectSheet />
			<TaskViewCreateSheet />
			<TaskViewUpdateSheet />
			{/* <TasksSuggestions /> */}
			<TaskDependencyDialog />
		</>
	);
};
