import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "..";
import {
	creditBalance,
	creditLedger,
	type creditMovementTypeEnum,
} from "../schema";

export type CreditMovementType =
	(typeof creditMovementTypeEnum.enumValues)[number];

export const getCreditBalance = async ({ teamId }: { teamId: string }) => {
	const [balance] = await db
		.select()
		.from(creditBalance)
		.where(eq(creditBalance.teamId, teamId))
		.limit(1);

	if (balance) {
		return balance;
	}

	const [created] = await db
		.insert(creditBalance)
		.values({
			teamId,
			balanceCents: 0,
		})
		.onConflictDoNothing()
		.returning();

	if (created) {
		return created;
	}

	return null;
};

export const createCreditMovement = async ({
	teamId,
	type,
	amountCents,
	stripePaymentIntentId,
	stripeEventId,
	metadata,
}: {
	teamId: string;
	type: CreditMovementType;
	amountCents: number;
	stripePaymentIntentId?: string;
	stripeEventId?: string;
	metadata?: Record<string, unknown>;
}) => {
	return await db.transaction(async (tx) => {
		await tx
			.insert(creditBalance)
			.values({
				teamId,
				balanceCents: 0,
			})
			.onConflictDoNothing();

		let movement: typeof creditLedger.$inferSelect | null | undefined;

		if (stripeEventId) {
			[movement] = await tx
				.insert(creditLedger)
				.values({
					teamId,
					type,
					amountCents,
					stripePaymentIntentId,
					stripeEventId,
					metadata,
				})
				.onConflictDoNothing()
				.returning();

			if (!movement) {
				const [existingMovement] = await tx
					.select()
					.from(creditLedger)
					.where(
						and(
							eq(creditLedger.stripeEventId, stripeEventId),
							eq(creditLedger.teamId, teamId),
						),
					)
					.limit(1);
				const [existingBalance] = await tx
					.select()
					.from(creditBalance)
					.where(eq(creditBalance.teamId, teamId))
					.limit(1);

				return {
					movement: existingMovement ?? null,
					balanceCents: existingBalance?.balanceCents ?? 0,
					applied: false,
				};
			}
		} else {
			[movement] = await tx
				.insert(creditLedger)
				.values({
					teamId,
					type,
					amountCents,
					stripePaymentIntentId,
					metadata,
				})
				.returning();
		}

		const [updatedBalance] = await tx
			.update(creditBalance)
			.set({
				balanceCents: sql`${creditBalance.balanceCents} + ${amountCents}`,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(creditBalance.teamId, teamId))
			.returning();

		return {
			movement: movement ?? null,
			balanceCents: updatedBalance?.balanceCents ?? 0,
			applied: true,
		};
	});
};

export const recordCreditPurchase = async ({
	teamId,
	amountCents,
	stripePaymentIntentId,
	stripeEventId,
	metadata,
}: {
	teamId: string;
	amountCents: number;
	stripePaymentIntentId: string;
	stripeEventId?: string;
	metadata?: Record<string, unknown>;
}) => {
	return createCreditMovement({
		teamId,
		type: "purchase",
		amountCents: Math.abs(amountCents),
		stripePaymentIntentId,
		stripeEventId,
		metadata,
	});
};

export const recordCreditRefund = async ({
	teamId,
	amountCents,
	stripePaymentIntentId,
	stripeEventId,
	metadata,
}: {
	teamId: string;
	amountCents: number;
	stripePaymentIntentId?: string;
	stripeEventId?: string;
	metadata?: Record<string, unknown>;
}) => {
	return createCreditMovement({
		teamId,
		type: "refund",
		amountCents: -Math.abs(amountCents),
		stripePaymentIntentId,
		stripeEventId,
		metadata,
	});
};

export const recordCreditAdjustment = async ({
	teamId,
	amountCents,
	stripePaymentIntentId,
	stripeEventId,
	metadata,
}: {
	teamId: string;
	amountCents: number;
	stripePaymentIntentId?: string;
	stripeEventId?: string;
	metadata?: Record<string, unknown>;
}) => {
	return createCreditMovement({
		teamId,
		type: "adjustment",
		amountCents,
		stripePaymentIntentId,
		stripeEventId,
		metadata,
	});
};

export const recordCreditPromo = async ({
	teamId,
	amountCents,
	metadata,
}: {
	teamId: string;
	amountCents: number;
	metadata?: Record<string, unknown>;
}) => {
	return createCreditMovement({
		teamId,
		type: "promo",
		amountCents,
		metadata,
	});
};

export const recordCreditUsage = async ({
	teamId,
	amountCents,
	metadata,
}: {
	teamId: string;
	amountCents: number;
	metadata?: Record<string, unknown>;
}) => {
	return createCreditMovement({
		teamId,
		type: "usage",
		amountCents: -Math.abs(amountCents),
		metadata,
	});
};

export const getCreditMovements = async ({
	teamId,
	limit = 50,
}: {
	teamId: string;
	limit?: number;
}) => {
	return await db
		.select()
		.from(creditLedger)
		.where(eq(creditLedger.teamId, teamId))
		.orderBy(desc(creditLedger.createdAt))
		.limit(limit);
};
