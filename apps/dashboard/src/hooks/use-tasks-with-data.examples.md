# useTasksWithData Hook - Usage Examples

## Overview

The `useTasksWithData` hook provides a unified way to fetch and manage tasks with their related data (statuses and team members). It performs client-side joins, making cache updates simpler and more efficient.

## Basic Usage

```tsx
import { useTasksWithData } from "@/hooks/use-tasks-with-data";

function TasksList() {
  const { tasks, isLoading, fetchNextPage, hasNextPage } = useTasksWithData({
    statusType: ["todo", "in_progress"],
    assigneeId: ["me"],
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}
```

## Benefits Over Direct useQuery

### Before (Multiple Queries)

```tsx
// ❌ Old approach - multiple queries, complex cache updates
const { data: tasks } = useQuery(trpc.tasks.get.queryOptions());
const { data: statuses } = useQuery(trpc.statuses.get.queryOptions());
const { data: members } = useQuery(trpc.teams.getMembers.queryOptions());

// Manually merge data
const enrichedTasks = tasks?.data.map((task) => {
  const status = statuses?.data.find((s) => s.id === task.statusId);
  const assignee = members?.find((m) => m.id === task.assigneeId);
  return { ...task, status, assignee };
});
```

### After (Single Hook)

```tsx
// ✅ New approach - single hook, automatic merging
const { tasks } = useTasksWithData();
// tasks already have status and assignee merged
```

## Updating Cache - Simple Patterns

### Updating a Status

When you update a status, it automatically reflects in all tasks:

```tsx
import { useStatuses } from "@/hooks/use-tasks-with-data";
import { queryClient, trpc } from "@/utils/trpc";

function updateTaskStatus() {
  const { mutate } = useMutation(
    trpc.statuses.update.mutationOptions({
      onSuccess: (updatedStatus) => {
        // Update the statuses cache
        queryClient.setQueryData(
          trpc.statuses.get.queryKey(),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((s) =>
                s.id === updatedStatus.id ? updatedStatus : s
              ),
            };
          }
        );
        // All tasks with this status will now show the updated data!
      },
    })
  );
}
```

### Updating Task Properties

```tsx
function updateTask() {
  const { mutate } = useMutation(
    trpc.tasks.update.mutationOptions({
      onSuccess: (updatedTask) => {
        // Update the specific task in the infinite query cache
        queryClient.setQueriesData(
          { queryKey: trpc.tasks.get.queryKey() },
          (old: any) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data.map((task: any) =>
                  task.id === updatedTask.id ? updatedTask : task
                ),
              })),
            };
          }
        );
      },
    })
  );
}
```

## Advanced: Accessing Lookups

The hook exposes lookup maps for efficient data access:

```tsx
const { tasks, lookups } = useTasksWithData();

// Get a status by ID instantly
const status = lookups.statuses.get(statusId);

// Get a member by ID instantly
const member = lookups.members.get(memberId);
```

## Using Separate Hooks

For components that only need statuses or members:

```tsx
import { useStatuses, useTeamMembers } from "@/hooks/use-tasks-with-data";

function StatusPicker() {
  const { data: statuses } = useStatuses();
  return (
    <select>
      {statuses?.data.map((status) => (
        <option key={status.id} value={status.id}>
          {status.name}
        </option>
      ))}
    </select>
  );
}

function MemberPicker() {
  const { data: members } = useTeamMembers();
  return (
    <select>
      {members?.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
    </select>
  );
}
```

## Performance Considerations

1. **Statuses and members are cached for 5 minutes** - They don't refetch on every render
2. **Automatic deduplication** - Multiple components using the hook share the same cache
3. **Client-side joins are fast** - Uses Map lookups (O(1) complexity)
4. **Reduced server load** - Fetch statuses/members once, not on every task query

## Migration Guide

To migrate existing components:

1. Replace `useInfiniteQuery(trpc.tasks.get.infiniteQueryOptions(...))` with `useTasksWithData(...)`
2. Remove manual status/member queries if present
3. Simplify cache update logic to update statuses/members cache instead of individual tasks
4. Remove manual data merging/enrichment code

Example:

```tsx
// Before
const { data, fetchNextPage } = useInfiniteQuery(
  trpc.tasks.get.infiniteQueryOptions({ statusType: ["todo"] })
);
const tasks = data?.pages.flatMap((page) => page.data) || [];

// After
const { tasks, fetchNextPage } = useTasksWithData({ statusType: ["todo"] });
```
