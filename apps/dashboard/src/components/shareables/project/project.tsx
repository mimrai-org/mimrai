import type { RouterOutputs } from "@api/trpc/routers";
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
				<h1 className="font-medium font-runic text-2xl">{project.name}</h1>
			</div>
			<div className="flex flex-wrap gap-2" />
			{project.description ? (
				<Response>{project.description}</Response>
			) : (
				<span className="text-muted-foreground">No description provided.</span>
			)}
			<ProjectBoardShareable tasks={tasks} />
		</div>
	);
};

export const ProjectShareableOgImage = ({
	project,
}: {
	project: NonNullable<RouterOutputs["projects"]["getById"]>;
}) => {
	return (
		<div
			style={{
				fontSize: 64,
				background: "white",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{project.name}
		</div>
	);
};
