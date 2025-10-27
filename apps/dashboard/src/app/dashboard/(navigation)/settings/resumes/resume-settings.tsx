"use client";
import { t } from "@mimir/locale";
import { Card, CardContent, CardDescription, CardHeader } from "@mimir/ui/card";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { ResumeSettingsForm } from "./resume-settings-form";

export const ResumeSettings = () => {
	const { data: settings } = useQuery(trpc.resumeSettings.get.queryOptions());

	return (
		<Card>
			<CardHeader>
				<CardDescription>{t("settings.resumes.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				{settings ? (
					<ResumeSettingsForm defaultValues={settings} />
				) : (
					<div>Loading...</div>
				)}
			</CardContent>
		</Card>
	);
};
