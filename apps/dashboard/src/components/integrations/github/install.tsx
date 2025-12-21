"use client";
import { Button } from "@mimir/ui/button";
import { Form } from "@mimir/ui/form";
import { getApiUrl } from "@mimir/utils/envs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/ui/alert";
import { Switch } from "@ui/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useUser } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import type { IntegrationConfigFormProps } from "../components";

const schema = z.object({});

export const InstallIntegrationGithubForm = ({
	integration,
}: IntegrationConfigFormProps) => {
	const [error, setError] = useState<string | null>(null);
	const [isValid, setIsValid] = useState(false);
	const user = useUser();
	const form = useZodForm(schema, {
		defaultValues: {
			...integration?.installedIntegration?.config,
		},
	});
	const id = integration?.installedIntegration?.id;

	const { mutate: install } = useMutation(
		trpc.github.install.mutationOptions({
			onMutate: () => {
				toast.loading("Installing GitHub Integration...", {
					id: "install-github-integration",
				});
			},
			onSuccess: (data) => {
				toast.success(data.message, {
					id: "install-github-integration",
				});
				if (data.redirect) {
					const url = new URL(
						`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`,
					);
					const redirectUrl = new URL(`${getApiUrl()}/webhooks/github/setup`);
					url.searchParams.append("redirect_uri", redirectUrl.toString());
					console.log("Opening URL:", url.toString());
					window.open(url.toString(), "_blank", "noopener,noreferrer");
					return;
				}
			},
			onError: (error) => {
				toast.error(`Failed to install GitHub Integration: ${error.message}`, {
					id: "install-github-integration",
				});
			},
		}),
	);

	const handleInstall = () => {
		install();
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleInstall)} className="space-y-4">
				{id && (
					<Alert>
						<AlertDescription>
							GitHub Integration is installed.
						</AlertDescription>
					</Alert>
				)}

				{!id && (
					<Button type="button" onClick={handleInstall}>
						Install
					</Button>
				)}
			</form>
		</Form>
	);
};
