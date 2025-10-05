import { polarClient } from "./payments";

export const METERS = ["users"] as const;

export type Meter = (typeof METERS)[number];

export const addMeterUsage = async (
	teamId: string,
	meter: Meter,
	quantity = 1,
) => {
	const customer = await polarClient.customers.getExternal({
		externalId: teamId,
	});

	await polarClient.events.ingest({
		events: [
			{
				name: meter,
				customerId: customer.id,
				externalCustomerId: teamId,
				metadata: {
					quantity,
				},
			},
		],
	});
};
