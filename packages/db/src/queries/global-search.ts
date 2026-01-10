import { and, type SQL, sql } from "drizzle-orm";
import { QueryBuilder } from "drizzle-orm/pg-core";
import { db } from "../index";
import { globalSearchView } from "../schema";

export interface GlobalSearchResult {
	id: string;
	type: string;
	title: string;
	color?: string;
	teamId: string;
	parentId?: string | null;
}

export const globalSearch = async ({
	search,
	type,
	teamId,
}: {
	search?: string;
	type?: string[];
	teamId: string;
}) => {
	const qb = new QueryBuilder();

	const whereClause: SQL[] = [sql`team_id = ${teamId}`];

	search && whereClause.push(sql`title ILIKE ${`%${search}%`}`);
	type && whereClause.push(sql`"type" IN (${sql.join(type, ",")})`);

	const query = qb
		.select()
		.from(globalSearchView)
		.where(and(...whereClause))
		.orderBy(sql`type DESC`, sql`title ASC`)
		.limit(20);

	const result = await db.execute(query);
	const rows = result.rows.reduce<GlobalSearchResult[]>((acc, row) => {
		acc.push({
			id: row.id,
			type: row.type,
			title: row.title,
			color: row.color,
			parentId: row.parent_id,
			teamId: row.team_id,
		} as any as GlobalSearchResult);
		return acc;
	}, []);
	return rows;
};
