import { useFormContext } from "react-hook-form";
import { TaskExecutionCard } from "@/components/task-execution-card";
import type { TaskFormValues } from "./form-type";

export const TaskExecution = () => {
	const form = useFormContext<TaskFormValues>();
	const taskId = form.watch("id");

	if (!taskId) return null;

	return <TaskExecutionCard taskId={taskId} />;
};
