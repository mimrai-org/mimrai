"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { Switch } from "@ui/components/ui/switch";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import type { IntegrationConfigFormProps } from "../components";

const schema = z.object({
	host: z.string().min(1, "Host is required"),
	port: z.coerce.number().int().min(1).max(65535),
	user: z.string().min(1, "User is required"),
	password: z.string().min(1, "Password is required"),
	secure: z.boolean().default(false),
	fromName: z.string().optional(),
	fromEmail: z.string().email().optional().or(z.literal("")),
});

export const ConfigIntegrationSmtpForm = ({
	integration,
}: IntegrationConfigFormProps) => {
	const installedConfig = integration.installedIntegration?.config as
		| {
				host?: string;
				port?: number;
				user?: string;
				password?: string;
				secure?: boolean;
				fromName?: string;
				fromEmail?: string;
		  }
		| undefined;

	const form = useZodForm(schema, {
		defaultValues: {
			host: installedConfig?.host || "",
			port: installedConfig?.port ?? 587,
			user: installedConfig?.user || "",
			password: installedConfig?.password || "",
			secure: installedConfig?.secure ?? false,
			fromName: installedConfig?.fromName || "",
			fromEmail: installedConfig?.fromEmail || "",
		},
	});

	const { mutateAsync: installIntegration } = useMutation(
		trpc.integrations.install.mutationOptions(),
	);

	const { mutateAsync: updateIntegration } = useMutation(
		trpc.integrations.update.mutationOptions(),
	);

	const { mutateAsync: linkCurrentUser } = useMutation(
		trpc.integrations.linkCurrentUser.mutationOptions(),
	);

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		toast.loading("Saving SMTP configuration...", {
			id: "save-smtp-config",
		});

		try {
			const config = {
				...data,
				fromEmail: data.fromEmail || undefined,
				fromName: data.fromName || undefined,
			};

			const integrationId = integration.installedIntegration?.id;
			if (integrationId) {
				await updateIntegration({
					id: integrationId,
					config,
				});
			} else {
				await installIntegration({
					type: "smtp",
					config,
				});
			}

			await linkCurrentUser({
				integrationType: "smtp",
			});

			await Promise.all([
				queryClient.invalidateQueries(trpc.integrations.get.queryOptions()),
				queryClient.invalidateQueries(
					trpc.integrations.getByType.queryOptions({
						type: "smtp",
					}),
				),
			]);

			toast.success("SMTP configuration saved successfully", {
				id: "save-smtp-config",
			});
		} catch (_error) {
			toast.error("Failed to save SMTP configuration", {
				id: "save-smtp-config",
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="host"
					render={({ field }) => (
						<FormItem>
							<FormLabel>SMTP Host</FormLabel>
							<FormControl>
								<Input placeholder="smtp.example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="port"
					render={({ field }) => (
						<FormItem>
							<FormLabel>SMTP Port</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1}
									max={65535}
									placeholder="587"
									value={field.value ?? ""}
									onChange={(e) => field.onChange(e.target.value)}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="user"
					render={({ field }) => (
						<FormItem>
							<FormLabel>User</FormLabel>
							<FormControl>
								<Input placeholder="user@example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input type="password" placeholder="••••••••" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="fromName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>From Name (optional)</FormLabel>
							<FormControl>
								<Input placeholder="MIMIR Bot" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="fromEmail"
					render={({ field }) => (
						<FormItem>
							<FormLabel>From Email (optional)</FormLabel>
							<FormControl>
								<Input placeholder="noreply@example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="secure"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between rounded-md border px-4 py-3">
							<FormLabel>Use TLS (secure)</FormLabel>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				<div className="flex items-center justify-end gap-2">
					<Button type="submit" disabled={form.formState.isSubmitting}>
						<SaveIcon />
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
