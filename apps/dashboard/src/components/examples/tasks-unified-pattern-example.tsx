import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
updateStatusInCache,
updateTaskInCache,
} from "@/hooks/use-tasks-cache-helpers";
import { useTasksWithData } from "@/hooks/use-tasks-with-data";
import { trpc } from "@/utils/trpc";

/**
 * Example component showing the new unified tasks pattern.
 * This demonstrates how simple cache updates become with the new architecture.
 */
export function TasksListExample() {
// 1. Use the unified hook - gets tasks with statuses and members merged
const { tasks, isLoading, lookups } = useTasksWithData({
statusType: ["todo", "in_progress"],
});

// 2. Update status - affects ALL tasks with this status
const { mutate: updateStatus } = useMutation(
trpc.statuses.update.mutationOptions({
onSuccess: (updatedStatus) => {
// Simple cache update - all tasks automatically update!
updateStatusInCache(updatedStatus);
},
}),
);

// 3. Update task - affects only this specific task
const { mutate: updateTask } = useMutation(
trpc.tasks.update.mutationOptions({
onSuccess: (updatedTask) => {
// Update just this task in cache
updateTaskInCache(updatedTask);
},
}),
);

// 4. Quick lookups using the exposed maps
const getStatusName = (statusId: string) => {
return lookups.statuses.get(statusId)?.name ?? "Unknown";
};

const getMemberName = (memberId: string) => {
return lookups.members.get(memberId)?.name ?? "Unassigned";
};

if (isLoading) {
return <div>Loading tasks...</div>;
}

return (
<div className="space-y-4">
<h2 className="text-2xl font-bold">Tasks</h2>

{tasks.map((task) => (
<div key={task.id} className="border rounded p-4 space-y-2">
<h3 className="font-semibold">{task.title}</h3>

{/* Status is already merged from cache */}
<div className="text-sm text-muted-foreground">
Status: {task.status?.name ?? "No status"}
</div>

{/* Assignee is already merged from cache */}
<div className="text-sm text-muted-foreground">
Assigned to: {task.assignee?.name ?? "Unassigned"}
</div>

{/* Or use the lookup maps for quick access */}
<div className="text-sm text-muted-foreground">
Status (via lookup): {getStatusName(task.statusId)}
</div>

<div className="flex gap-2">
<Button
size="sm"
onClick={() => {
updateTask({
id: task.id,
title: `${task.title} (updated)`,
});
}}
>
Update Task
</Button>

{task.status && (
<Button
size="sm"
variant="outline"
onClick={() => {
updateStatus({
id: task.status.id,
name: `${task.status.name} (updated)`,
});
}}
>
Update Status (affects all tasks)
</Button>
)}
</div>
</div>
))}
</div>
);
}

/**
 * Example showing status picker with the new pattern
 */
export function StatusPickerExample() {
const { lookups } = useTasksWithData();

return (
<select className="border rounded p-2">
{Array.from(lookups.statuses.values()).map((status) => (
<option key={status.id} value={status.id}>
{status.name}
</option>
))}
</select>
);
}

/**
 * Example showing member picker with the new pattern
 */
export function MemberPickerExample() {
const { lookups } = useTasksWithData();

return (
<select className="border rounded p-2">
{Array.from(lookups.members.values()).map((member) => (
<option key={member.id} value={member.id}>
{member.name}
</option>
))}
</select>
);
}
