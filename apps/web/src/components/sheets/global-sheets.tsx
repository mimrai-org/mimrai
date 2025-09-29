import { ColumnCreateSheet } from "./column-create-sheet";
import { TaskCreateSheet } from "./task-create-sheet";

export const GlobalSheets = () => {
	return (
		<>
			<TaskCreateSheet />
			<ColumnCreateSheet />
		</>
	);
};
