DELETE from tasks WHERE tasks.id IN (
  SELECT tasks.id
  FROM tasks
  inner join statuses on statuses.id = tasks.status_id
  where statuses.project_id is not null
)