"server-only";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cache } from "react";
import { queryClient } from "./trpc";

export const getQueryClient = cache(() => queryClient);

export function HydrateClient(props: { children: React.ReactNode }) {
	const queryClient = getQueryClient();
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			{props.children}
		</HydrationBoundary>
	);
}
