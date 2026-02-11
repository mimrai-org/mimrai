# Quick Start Guide: Using the Unified Tasks Hook

## TL;DR

Replace this:
```tsx
const { data } = useInfiniteQuery(trpc.tasks.get.infiniteQueryOptions({...}));
const tasks = data?.pages.flatMap(page => page.data) || [];
```

With this:
```tsx
const { tasks } = useTasksWithData({...});
```

That's it! Tasks now include merged status and member data from separate caches.

## 5-Minute Integration Guide

### Step 1: Import the Hook

```tsx
import { useTasksWithData } from "@/hooks/use-tasks-with-data";
```

### Step 2: Replace Your Query

**Before:**
```tsx
const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery(
  trpc.tasks.get.infiniteQueryOptions(
    { statusType: ["todo"], assigneeId: ["me"] },
    { getNextPageParam: (lastPage) => lastPage.meta.cursor }
  )
);
const tasks = useMemo(() => data?.pages.flatMap(page => page.data) || [], [data]);
```

**After:**
```tsx
const { tasks, fetchNextPage, hasNextPage, isLoading } = useTasksWithData({
  statusType: ["todo"],
  assigneeId: ["me"],
});
```

### Step 3: Simplify Cache Updates

**Before:**
```tsx
onSuccess: (updatedStatus) => {
  queryClient.invalidateQueries(trpc.statuses.get.queryOptions());
  queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
}
```

**After:**
```tsx
import { updateStatusInCache } from "@/hooks/use-tasks-cache-helpers";

onSuccess: (updatedStatus) => {
  updateStatusInCache(updatedStatus); // All tasks update automatically!
}
```

## Common Patterns

### Pattern 1: Basic Task List
```tsx
function MyTaskList() {
  const { tasks, isLoading } = useTasksWithData({
    projectId: [projectId],
  });

  if (isLoading) return <Loader />;

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          {task.title} - {task.status?.name}
        </li>
      ))}
    </ul>
  );
}
```

### Pattern 2: Filtered Tasks
```tsx
function TodoTasks() {
  const { tasks } = useTasksWithData({
    statusType: ["todo", "in_progress"],
    assigneeId: ["me"],
  });

  return <TasksList tasks={tasks} />;
}
```

### Pattern 3: With Infinite Scroll
```tsx
function InfiniteTasksList() {
  const { tasks, fetchNextPage, hasNextPage, isFetchingNextPage } = 
    useTasksWithData({ pageSize: 20 });

  return (
    <>
      <TasksList tasks={tasks} />
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
          Load More
        </Button>
      )}
    </>
  );
}
```

### Pattern 4: Quick Lookups
```tsx
function TaskDetail({ taskId }: { taskId: string }) {
  const { tasks, lookups } = useTasksWithData();
  const task = tasks.find(t => t.id === taskId);

  // Quick status lookup (O(1))
  const status = lookups.statuses.get(task.statusId);
  
  return <div>{status?.name}</div>;
}
```

## Cache Update Patterns

### Update Status → All Tasks Update
```tsx
import { updateStatusInCache } from "@/hooks/use-tasks-cache-helpers";

const { mutate } = useMutation(
  trpc.statuses.update.mutationOptions({
    onSuccess: (status) => {
      updateStatusInCache(status);
      toast.success("Status updated!");
    },
  })
);
```

### Update Member → All Assigned Tasks Update
```tsx
import { updateMemberInCache } from "@/hooks/use-tasks-cache-helpers";

const { mutate } = useMutation(
  trpc.teams.updateMember.mutationOptions({
    onSuccess: (member) => {
      updateMemberInCache(member);
      toast.success("Member updated!");
    },
  })
);
```

### Update Single Task
```tsx
import { updateTaskInCache } from "@/hooks/use-tasks-cache-helpers";

const { mutate } = useMutation(
  trpc.tasks.update.mutationOptions({
    onSuccess: (task) => {
      updateTaskInCache(task);
      toast.success("Task updated!");
    },
  })
);
```

## Troubleshooting

### Q: Tasks aren't showing updated status
**A:** Make sure you're using `updateStatusInCache()` instead of invalidating queries.

### Q: Performance issues with many tasks
**A:** The hook uses efficient O(1) lookups. If issues persist, check if you have other performance bottlenecks.

### Q: Need to refetch everything
**A:** Use `invalidateTasksCache()` from cache helpers, or the `refetch` function from the hook.

### Q: Status/members not updating in real-time
**A:** They're cached for 5 minutes by default. This is intentional for performance. Use cache helpers to update manually when needed.

## Next Steps

- Read full examples: `apps/dashboard/src/hooks/use-tasks-with-data.examples.md`
- Understand architecture: `apps/dashboard/TASKS_DATA_ARCHITECTURE.md`
- See live code: `apps/dashboard/src/components/examples/tasks-unified-pattern-example.tsx`

## Need Help?

Check the comprehensive documentation files or look at the migrated components:
- `apps/dashboard/src/components/tasks-view/tasks-view.tsx`
- `apps/dashboard/src/components/forms/project-form/tasks-list.tsx`
- `apps/dashboard/src/components/forms/status-form.tsx`
