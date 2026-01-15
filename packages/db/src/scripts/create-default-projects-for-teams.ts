import { and, eq, isNull } from "drizzle-orm";
import { db } from "..";
import { projects, tasks, teams, usersOnTeams } from "../schema";

const allTeams = await db.select().from(teams);

for (const team of allTeams) {
	// Check if this team has any projects
	const existingProjects = await db
		.select({ id: projects.id })
		.from(projects)
		.where(eq(projects.teamId, team.id))
		.limit(1);

	// Get the team owner (or any member if no owner exists)
	const [teamOwner] = await db
		.select({ userId: usersOnTeams.userId })
		.from(usersOnTeams)
		.where(
			and(eq(usersOnTeams.teamId, team.id), eq(usersOnTeams.role, "owner")),
		)
		.limit(1);

	if (!teamOwner) {
		console.log(`Team "${team.name}" (${team.id}) has no owner, skipping`);
		continue;
	}
	let projectId = null;

	if (existingProjects.length > 0) {
		projectId = existingProjects[0].id;
	} else {
		// Create a project with the team name
		const [newProject] = await db
			.insert(projects)
			.values({
				name: team.name,
				teamId: team.id,
				userId: teamOwner.userId,
				visibility: "team",
				status: "in_progress",
			})
			.returning();

		if (!newProject) {
			console.log(
				`Failed to create project for team "${team.name}" (${team.id})`,
			);
			continue;
		}

		projectId = newProject.id;

		console.log(
			`Created project "${newProject.name}" (${newProject.id}) for team "${team.name}" (${team.id})`,
		);
	}
	// Update all tasks without a project in this team to use the new project
	const updatedTasks = await db
		.update(tasks)
		.set({ projectId })
		.where(and(eq(tasks.teamId, team.id), isNull(tasks.projectId)))
		.returning({ id: tasks.id });

	console.log(
		`Updated ${updatedTasks.length} tasks without project in team "${team.name}" to project "${projectId}"`,
	);
}

console.log("Done!");
