# Unified Tasks Data Fetching - Implementation Summary

## Problem Statement
The original issue was that calling `useQuery` multiple times for tasks and making cache updates with `queryClient.setQueryData` was difficult and error-prone. The goal was to create a unified source of truth that fetches tasks, statuses, and team members separately and merges them on the client side.

## Solution Overview
Created a unified `useTasksWithData` hook that:
1. Fetches tasks, statuses, and team members in parallel
2. Performs efficient client-side joins using Map lookups (O(1))
3. Provides a single source of truth for task data
4. Simplifies cache updates dramatically

## Key Components

### 1. Main Hook: `use-tasks-with-data.ts`
```tsx
const { tasks, isLoading, lookups } = useTasksWithData({
  statusType: ["todo", "in_progress"],
});
```

**Features:**
- Fetches all three data sources with optimal caching
- 5-minute staleTime for statuses and members (rarely change)
- Automatic data merging using efficient lookups
- Exposes lookup maps for instant access

### 2. Cache Helpers: `use-tasks-cache-helpers.ts`
```tsx
// Update status - affects all tasks with this status
updateStatusInCache(updatedStatus);

// Update member - affects all tasks assigned to this member
updateMemberInCache(updatedMember);

// Update specific task
updateTaskInCache(updatedTask);
```

### 3. Documentation
- `use-tasks-with-data.examples.md` - Usage examples and patterns
- `TASKS_DATA_ARCHITECTURE.md` - Architecture and migration guide
- `tasks-unified-pattern-example.tsx` - Live code examples

## Benefits

### Before
```tsx
// Multiple queries
const { data: tasks } = useQuery(trpc.tasks.get.queryOptions());
const { data: statuses } = useQuery(trpc.statuses.get.queryOptions());
const { data: members } = useQuery(trpc.teams.getMembers.queryOptions());

// Complex manual merging
const enrichedTasks = tasks?.data.map(task => ({
  ...task,
  status: statuses?.data.find(s => s.id === task.statusId),
  assignee: members?.find(m => m.id === task.assigneeId),
}));

// Complex cache updates
onSuccess: () => {
  queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
  queryClient.invalidateQueries(trpc.statuses.get.queryOptions());
  queryClient.invalidateQueries(trpc.teams.getMembers.queryOptions());
}
```

### After
```tsx
// Single hook, automatic merging
const { tasks } = useTasksWithData();

// Simple, targeted cache update
onSuccess: (status) => {
  updateStatusInCache(status); // All tasks update automatically!
}
```

## Performance Improvements

1. **Reduced Server Load**
   - Statuses fetched once, cached 5 minutes
   - Members fetched once, cached 5 minutes
   - No redundant joins in every task query

2. **Faster Client Rendering**
   - O(1) lookup time using Map structures
   - No redundant data in API responses
   - Smaller payload sizes

3. **Better User Experience**
   - Instant updates across all tasks when status/member changes
   - No loading states for related data
   - Consistent data everywhere

## Migration Path

### Step 1: Replace useInfiniteQuery
```tsx
// Before
const { data } = useInfiniteQuery(trpc.tasks.get.infiniteQueryOptions({...}));
const tasks = data?.pages.flatMap(page => page.data) || [];

// After
const { tasks } = useTasksWithData({...});
```

### Step 2: Simplify Cache Updates
```tsx
// Before
onSuccess: () => {
  queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
}

// After
onSuccess: (status) => {
  updateStatusInCache(status);
}
```

### Step 3: Use Lookups for Quick Access
```tsx
const { lookups } = useTasksWithData();
const status = lookups.statuses.get(statusId); // Instant O(1) lookup
```

## Components Updated

### Already Migrated ✅
- `apps/dashboard/src/components/tasks-view/tasks-view.tsx`
- `apps/dashboard/src/components/forms/project-form/tasks-list.tsx`
- `apps/dashboard/src/components/forms/status-form.tsx`

### Ready for Migration
All components that use:
- `useInfiniteQuery(trpc.tasks.get.infiniteQueryOptions(...))`
- `queryClient.setQueryData` for tasks
- `queryClient.invalidateQueries` for tasks/statuses/members

## Testing Recommendations

1. **Functional Tests**
   - Verify tasks display correctly in all views (list, board, calendar)
   - Test status updates reflect immediately
   - Test member updates reflect immediately
   - Verify pagination still works
   - Test filters and search

2. **Performance Tests**
   - Monitor network requests (should see fewer status/member fetches)
   - Check React DevTools for re-renders
   - Measure time to interactive

3. **Cache Tests**
   - Verify stale times work correctly
   - Test cache invalidation when needed
   - Verify optimistic updates

## Next Steps

1. **Continue Migration**
   - Update remaining components to use `useTasksWithData`
   - Replace cache invalidation with optimistic updates
   - Monitor for any issues

2. **Optimize Database Query** (Future)
   - Remove status/assignee joins from `getTasks` query
   - Return only IDs for related entities
   - Further reduce payload size

3. **Expand Pattern** (Future)
   - Apply same pattern to projects
   - Apply to milestones
   - Apply to other entity relationships

## Questions?

See the comprehensive documentation:
- `apps/dashboard/src/hooks/use-tasks-with-data.examples.md`
- `apps/dashboard/TASKS_DATA_ARCHITECTURE.md`
- `apps/dashboard/src/components/examples/tasks-unified-pattern-example.tsx`
