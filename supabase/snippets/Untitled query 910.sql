
WITH
task_usage as (
  SELECT tasks.title,
    coalesce(SUM((task_executions.usage_metrics->'costUSD')::float), 0) as cost_usd
  FROM task_executions
  inner join tasks on tasks.id = task_executions.task_id
  where task_executions.created_at > now() - interval '1 hours'
  group by tasks.title
  order by coalesce(SUM((task_executions.usage_metrics->'costUSD')::float), 0) desc
),
project_usage as (
  SELECT 
    coalesce(SUM((project_executions.usage_metrics->'costUSD')::float), 0) as cost_usd
  FROM
    project_executions
  WHERE project_executions.created_at > now() - interval '1 hours'
),
total as (
  SELECT 
    SUM(task_usage.cost_usd) as task_cost,
    SUM(project_usage.cost_usd) as project_cost
  FROM task_usage
  inner join project_usage on true
)
SELECT 
  total.task_cost,
  total.project_cost,
  (total.task_cost + total.project_cost) as total_cost
FROM total;


  SELECT tasks.title, task_executions.usage_metrics
  FROM task_executions
  inner join tasks on tasks.id = task_executions.task_id
  where task_executions.created_at > now() - interval '1 hours';


  SELECT projects.name, project_executions.usage_metrics
  FROM project_executions
  inner join projects on projects.id = project_executions.project_id
  where project_executions.created_at > now() - interval '1 hours';