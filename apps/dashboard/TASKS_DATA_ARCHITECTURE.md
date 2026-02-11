# Tasks Data Fetching Simplification

## Overview

This implementation provides a unified approach to fetching and managing tasks with their related data (statuses and team members). The key innovation is moving data joins from the server to the client, creating a single source of truth that's easier to maintain and update.

## Architecture

### Before
```
┌─────────────────────┐
│  Component A        │
│  useQuery(tasks)    │──┐
└─────────────────────┘  │
                         │    ┌──────────────────┐
┌─────────────────────┐  │    │  Database        │
│  Component B        │  ├───►│  - Tasks Query   │
│  useQuery(tasks)    │──┘    │    with joins    │
└─────────────────────┘       └──────────────────┘

Problems:
- Every query includes joins
- Multiple sources of truth
- Hard to update related data
- Cache invalidation complex
```

### After
```
┌─────────────────────┐      ┌──────────────────┐
│  Component A        │      │  Statuses Cache  │
│  useTasksWithData() │──┬──►│  (5min stale)    │
└─────────────────────┘  │   └──────────────────┘
                         │
┌─────────────────────┐  │   ┌──────────────────┐
│  Component B        │  ├──►│  Members Cache   │
│  useTasksWithData() │──┤   │  (5min stale)    │
└─────────────────────┘  │   └──────────────────┘
                         │
                         │   ┌──────────────────┐
                         └──►│  Tasks Cache     │
                             │  (no joins)      │
                             └──────────────────┘

Benefits:
- Fetch statuses/members once
- Single source of truth
- Simple cache updates
- Better performance
```

## Key Files

### 1. `use-tasks-with-data.ts`
The main hook that:
- Fetches tasks, statuses, and members separately
- Creates efficient lookup maps (O(1) access)
- Merges data on the client
- Handles caching automatically

### 2. `use-tasks-cache-helpers.ts`
Helper functions for cache updates:
- `updateStatusInCache()` - Update one status, affects all tasks
- `updateMemberInCache()` - Update one member, affects all tasks
- `updateTaskInCache()` - Update a specific task
- `removeTaskFromCache()` - Remove a task from cache

### 3. `use-tasks-with-data.examples.md`
Comprehensive examples showing:
- Basic usage patterns
- Cache update strategies
- Migration guide
- Performance tips

## Migration Strategy

### Phase 1: Create New Hook ✅
- [x] Implement `useTasksWithData` hook
- [x] Add cache helper functions
- [x] Create documentation

### Phase 2: Update Core Components ✅
- [x] TasksView component
- [x] Project tasks list
- [x] Status form (with optimized updates)

### Phase 3: Gradual Migration (Ongoing)
- [ ] Update remaining components to use new hook
- [ ] Replace cache invalidation with optimistic updates
- [ ] Add more cache helpers as needed

## Example: Before & After

### Before
```tsx
// Component with complex cache management
const { data } = useInfiniteQuery(trpc.tasks.get.infiniteQueryOptions(...));
const tasks = data?.pages.flatMap(page => page.data) || [];

// Update requires invalidating multiple caches
onSuccess: () => {
  queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
  queryClient.invalidateQueries(trpc.statuses.get.queryOptions());
}
```

### After
```tsx
// Simple, unified hook
const { tasks } = useTasksWithData(...);

// Update is surgical and efficient
onSuccess: (status) => {
  updateStatusInCache(status); // All tasks update automatically
}
```

## Performance Benefits

1. **Reduced Server Load**
   - Statuses fetched once, not per task query
   - Members fetched once, not per task query
   - 5-minute cache prevents unnecessary refetches

2. **Faster Client Rendering**
   - Client-side joins use Map lookups (O(1))
   - No redundant data in responses
   - Smaller payloads from server

3. **Better UX**
   - Status changes reflect immediately across all tasks
   - Member changes reflect immediately across all tasks
   - No flash of stale data

## Cache Update Patterns

### Pattern 1: Update Related Entity
```tsx
// When updating a status
onSuccess: (status) => {
  updateStatusInCache(status);
  // All tasks with this status update automatically!
}
```

### Pattern 2: Update Task Property
```tsx
// When updating task title, description, etc.
onSuccess: (task) => {
  updateTaskInCache(task);
}
```

### Pattern 3: Fallback to Invalidation
```tsx
// When bulk operations or unsure of effects
onSuccess: () => {
  invalidateTasksCache();
}
```

## Testing Checklist

- [ ] Tasks display correctly in list view
- [ ] Tasks display correctly in board view
- [ ] Tasks display correctly in calendar view
- [ ] Status updates reflect immediately
- [ ] Member updates reflect immediately
- [ ] Task creation works
- [ ] Task updates work
- [ ] Task deletion works
- [ ] Pagination works
- [ ] Filters work
- [ ] Search works
- [ ] Loading states correct
- [ ] Error states handled

## Future Improvements

1. **Optimize Database Query**
   - Remove status/member joins from getTasks
   - Return only IDs for related entities
   - Further reduce payload size

2. **Add More Entity Types**
   - Projects (if frequently updated)
   - Labels (if frequently updated)
   - Milestones (if frequently updated)

3. **Advanced Caching**
   - Implement optimistic updates for all mutations
   - Add rollback on error
   - Add conflict resolution

4. **Monitoring**
   - Track cache hit rates
   - Monitor query performance
   - Measure bundle size impact
