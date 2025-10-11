import { and, eq, type SQL } from "drizzle-orm";
import { db } from "..";
import { githubRepositoryConnected } from "../schema";

export const getConnectedRepositories = async ({
	teamId,
}: {
	teamId?: string;
}) => {
	const whereClause: SQL[] = [];
	if (teamId) {
		whereClause.push(eq(githubRepositoryConnected.teamId, teamId));
	}
	const data = await db
		.select()
		.from(githubRepositoryConnected)
		.where(and(...whereClause));

	return data;
};

export const getConnectedRepositoryByRepoId = async ({
	teamId,
	repositoryId,
}: {
	teamId: string;
	repositoryId: number;
}) => {
	const [record] = await db
		.select()
		.from(githubRepositoryConnected)
		.where(
			and(
				eq(githubRepositoryConnected.teamId, teamId),
				eq(githubRepositoryConnected.repositoryId, repositoryId),
			),
		);
	return record;
};

export const connectRepository = async ({
	teamId,
	installationId,
	repositoryId,
	repositoryName,
	integrationId,
}: {
	teamId: string;
	installationId: number;
	repositoryId: number;
	repositoryName: string;
	integrationId: string;
}) => {
	const [existing] = await db
		.select()
		.from(githubRepositoryConnected)
		.where(
			and(
				eq(githubRepositoryConnected.teamId, teamId),
				eq(githubRepositoryConnected.repositoryId, repositoryId),
			),
		);

	if (existing) {
		return existing;
	}

	const [record] = await db
		.insert(githubRepositoryConnected)
		.values({
			teamId,
			repositoryId,
			repositoryName,
			integrationId,
			installationId,
		})
		.returning();

	return record;
};

export const updateConnectedRepository = async ({
	id,
	teamId,
	branches,
}: {
	id: string;
	teamId?: string;
	branches?: string[];
}) => {
	const whereClause: SQL[] = [eq(githubRepositoryConnected.id, id)];
	if (teamId) {
		whereClause.push(eq(githubRepositoryConnected.teamId, teamId));
	}

	const [record] = await db
		.update(githubRepositoryConnected)
		.set({
			branches,
		})
		.where(and(...whereClause))
		.returning();

	return record;
};

export const disconnectRepository = async ({
	teamId,
	repositoryId,
}: {
	teamId: string;
	repositoryId: number;
}) => {
	const [record] = await db
		.delete(githubRepositoryConnected)
		.where(
			and(
				eq(githubRepositoryConnected.teamId, teamId),
				eq(githubRepositoryConnected.repositoryId, repositoryId),
			),
		)
		.returning();

	return record;
};

export const getConnectedRepositoryByInstallationId = async ({
	installationId,
	repoId,
}: {
	installationId: number;
	repoId: number;
}) => {
	const [record] = await db
		.select()
		.from(githubRepositoryConnected)
		.where(
			and(
				eq(githubRepositoryConnected.installationId, installationId),
				eq(githubRepositoryConnected.repositoryId, repoId),
			),
		);
	return record;
};
