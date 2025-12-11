import {
	type AnyColumn,
	type InferColumnsDataTypes,
	type SQL,
	sql,
} from "drizzle-orm";

// ⚠️ Potential for SQL injections, so you shouldn't allow user-specified key names
export function jsonAggBuildObject<T extends Record<string, AnyColumn>>(
	shape: T,
) {
	const chunks: SQL[] = [];

	Object.entries(shape).forEach(([key, value]) => {
		if (chunks.length > 0) {
			chunks.push(sql.raw(","));
		}
		chunks.push(sql.raw(`'${key}',`));
		chunks.push(sql`${value}`);
	});

	return sql<
		InferColumnsDataTypes<T>[]
	>`json_agg(json_build_object(${sql.join(chunks)}))`;
}
