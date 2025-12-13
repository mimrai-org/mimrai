"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ZenModeLoading } from "@/components/zen-mode/loading";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";

export default function Page() {
	const router = useRouter();

	const user = useUser();
	const { data } = useQuery(
		trpc.tasks.get.queryOptions(
			{
				assigneeId: [user?.id || ""],
				statusType: ["to_do", "in_progress"],
				view: "board",
				pageSize: 1,
			},
			{
				enabled: !!user?.id,
			},
		),
	);

	useEffect(() => {
		if (data && data.data.length > 0) {
			// Redirect to the zen mode page for the first task
			const taskId = data!.data[0]!.id;
			router.replace(`/team/${user?.team?.slug}/zen/${taskId}`);
		}
	}, [data]);

	return (
		<div className="flex h-screen items-center justify-center bg-background">
			<ZenModeLoading />
		</div>
	);
}
