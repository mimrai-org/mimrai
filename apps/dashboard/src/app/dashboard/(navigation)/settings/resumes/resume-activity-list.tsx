"use client";
import { t } from "@mimir/locale";
import { Button } from "@mimir/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import { Markdown } from "@mimir/ui/markdown";
import { useQuery } from "@tanstack/react-query";
import { RefreshCwIcon } from "lucide-react";
import { Response } from "@/components/ai-elements/response";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export const ResumeActivityList = () => {
	const { data: settings } = useQuery(trpc.resumeSettings.get.queryOptions());
	const {
		data: activities,
		isLoading,
		refetch,
	} = useQuery(
		trpc.activities.get.queryOptions(
			{
				type: ["resume_generated"],
				groupId: settings?.id,
			},
			{
				enabled: !!settings?.id,
			},
		),
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>{t("settings.resumes.activity.title")}</CardTitle>
					<Button
						type="button"
						size={"sm"}
						variant={"ghost"}
						disabled={isLoading}
						onClick={() => {
							refetch();
						}}
					>
						<RefreshCwIcon className={cn({ "animate-spin": isLoading })} />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<ul className="text-sm">
					{activities?.data.map((activity) => (
						<li key={activity.id} className="border-b py-4 last:border-0">
							<Response>{activity.metadata?.summary}</Response>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
