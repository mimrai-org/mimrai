import type { RouterOutputs } from "@mimir/trpc";
import { ProjectIcon } from "@/components/project-icon";
import { Response } from "../../chat/response";
import { ProjectBoardShareable } from "./board";

export const ProjectShareable = ({
	project,
	tasks,
}: {
	project: NonNullable<RouterOutputs["projects"]["getById"]>;
	tasks: NonNullable<RouterOutputs["tasks"]["get"]>;
}) => {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<ProjectIcon {...project} />
				<h1 className="font-medium text-2xl">{project.name}</h1>
			</div>

			{project.description && <Response>{project.description}</Response>}
			<ProjectBoardShareable tasks={tasks} />
		</div>
	);
};
