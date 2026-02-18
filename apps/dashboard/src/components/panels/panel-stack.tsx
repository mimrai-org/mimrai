"use client";
import { AnimatePresence } from "motion/react";
import {
	CREATE_DOCUMENT_PANEL_TYPE,
	CreateDocumentPanel,
	DOCUMENT_PANEL_TYPE,
	DocumentPanel,
} from "./document-panel";
import { usePanels } from "./panel-context";
import {
	CLONE_TASK_PANEL_TYPE,
	CloneTaskPanel,
	CREATE_TASK_PANEL_TYPE,
	CreateTaskPanel,
	TASK_PANEL_TYPE,
	TaskPanel,
} from "./task-panel";

/**
 * Renders all open panels.
 * Add new panel type renderers here.
 */
export function PanelStack() {
	const { panels } = usePanels();

	return (
		<AnimatePresence mode="sync">
			{panels.map((panel, index) => {
				switch (panel.type) {
					case TASK_PANEL_TYPE:
						return (
							<TaskPanel
								key={`${panel.type}-${panel.id}`}
								panel={panel}
								index={index}
							/>
						);
					case CREATE_TASK_PANEL_TYPE:
						return (
							<CreateTaskPanel
								key={`${panel.type}-${panel.id}`}
								panel={panel}
								index={index}
							/>
						);
					case CLONE_TASK_PANEL_TYPE:
						return (
							<CloneTaskPanel
								key={`${panel.type}-${panel.id}`}
								panel={panel}
								index={index}
							/>
						);
					// Add more panel types here:
					// case PROJECT_PANEL_TYPE:
					//   return <ProjectPanel key={`${panel.type}-${panel.id}`} panel={panel} index={index} />;
					case DOCUMENT_PANEL_TYPE:
						return (
							<DocumentPanel
								key={`${panel.type}-${panel.id}`}
								panel={panel}
								index={index}
							/>
						);
					case CREATE_DOCUMENT_PANEL_TYPE:
						return (
							<CreateDocumentPanel
								key={`${panel.type}-${panel.id}`}
								panel={panel}
								index={index}
							/>
						);
					default:
						return null;
				}
			})}
		</AnimatePresence>
	);
}
