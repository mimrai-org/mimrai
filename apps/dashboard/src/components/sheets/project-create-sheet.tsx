"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useProjectParams } from "@/hooks/use-project-params";
import { ProjectForm } from "../forms/project-form/form";

export const ProjectCreateSheet = () => {
	const { createProject, setParams } = useProjectParams();

	const isOpen = Boolean(createProject);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogHeader>
				<DialogTitle />
			</DialogHeader>
			<DialogContent className="sm:min-w-[1000px]">
				<ProjectForm propertiesLayout="compact" />
			</DialogContent>
		</Dialog>
	);
};
