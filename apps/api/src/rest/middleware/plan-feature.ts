import { checkPlanFeatures } from "@mimir/billing";
import type { PlanFeatureKey } from "@mimir/utils/plans";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withPlanFeatures: (
	features: PlanFeatureKey[],
) => MiddlewareHandler = (features) => async (c, next) => {
	const teamId = c.get("teamId");
	if (!teamId) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	const canAccess = await checkPlanFeatures(teamId, features);

	if (canAccess) {
		await next();
		return;
	}

	throw new HTTPException(401, { message: "Invalid or expired token" });
};
