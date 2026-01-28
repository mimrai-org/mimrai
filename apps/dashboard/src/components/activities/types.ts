import type { RouterOutputs } from "@mimir/trpc";

export type Activity = RouterOutputs["activities"]["get"]["data"][number];
