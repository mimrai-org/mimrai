"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@mimir/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mimir/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { trpc } from "@/utils/trpc";

const gmailConfigSchema = z.object({
	mode: z.enum(["auto", "strict_allow", "strict_deny"]),
	allowDomains: z.string().optional(),
	allowSenders: z.string().optional(),
	denyDomains: z.string().optional(),
	denySenders: z.string().optional(),
});

type GmailConfigFormValues = z.infer<typeof gmailConfigSchema>;

interface GmailConfigFormProps {
	integrationId: string;
	defaultConfig: {
		mode?: string;
		allowDomains?: string[];
		allowSenders?: string[];
		denyDomains?: string[];
		denySenders?: string[];
		refreshToken?: string;
		accessToken?: string;
		expiresAt?: number;
		lastSyncedAt?: string;
	};
}

export function GmailConfigForm({
	integrationId,
	defaultConfig,
}: GmailConfigFormProps) {
	const queryClient = useQueryClient();

	const { mutateAsync: updateIntegration } = useMutation(
		trpc.integrations.update.mutationOptions({
			onSuccess: () => {
				toast.success("Settings updated successfully");
				queryClient.invalidateQueries({
					queryKey: [
						["integrations", "getByType"],
						{ input: { type: "gmail" } },
					],
				});
			},
			onError: (error: any) => {
				toast.error(error.message || "Failed to update settings");
			},
		}),
	);

	const form = useForm<GmailConfigFormValues>({
		resolver: zodResolver(gmailConfigSchema),
		defaultValues: {
			mode: (defaultConfig.mode as any) || "auto",
			allowDomains: (defaultConfig.allowDomains || []).join(", "),
			allowSenders: (defaultConfig.allowSenders || []).join(", "),
			denyDomains: (defaultConfig.denyDomains || []).join(", "),
			denySenders: (defaultConfig.denySenders || []).join(", "),
		},
	});

	const onSubmit = async (data: GmailConfigFormValues) => {
		// Helper to split, normalize, and filter empty values
		const splitAndFilter = (str?: string) => {
			if (!str) return [];
			return str
				.split(",")
				.map((s) => s.trim().toLowerCase())
				.filter((s) => s.length > 0);
		};

		await updateIntegration({
			id: integrationId,
			config: {
				...defaultConfig,
				mode: data.mode,
				allowDomains: splitAndFilter(data.allowDomains),
				allowSenders: splitAndFilter(data.allowSenders),
				denyDomains: splitAndFilter(data.denyDomains),
				denySenders: splitAndFilter(data.denySenders),
			} as any,
		});
	};

	const handleReconnect = () => {
		// Redirect to OAuth flow
		const apiUrl =
			process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3003";
		window.location.href = `${apiUrl}/api/integrations/gmail/authorize`;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between rounded-lg border p-4">
				<div>
					<h3 className="font-medium">Connection Status</h3>
					<p className="text-muted-foreground text-sm">Connected to Gmail</p>
				</div>
				<Button variant="outline" onClick={handleReconnect}>
					Reconnect
				</Button>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<FormField
						control={form.control}
						name="mode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Filtering Mode</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a mode" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="auto">Auto (AI + Heuristics)</SelectItem>
										<SelectItem value="strict_allow">
											Strict Allow List
										</SelectItem>
										<SelectItem value="strict_deny">
											Strict Deny List
										</SelectItem>
									</SelectContent>
								</Select>
								<FormDescription>
									Auto uses AI to detect actionable items. Strict modes rely
									only on your lists.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{(form.watch("mode") === "strict_allow" ||
						form.watch("mode") === "auto") && (
						<>
							<FormField
								control={form.control}
								name="allowDomains"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Allowed Domains</FormLabel>
										<FormControl>
											<Input placeholder="example.com, company.io" {...field} />
										</FormControl>
										<FormDescription>
											Comma-separated list of domains to always process
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="allowSenders"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Allowed Senders</FormLabel>
										<FormControl>
											<Input
												placeholder="boss@company.com, hr@company.com"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Comma-separated list of email addresses to always process
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					{(form.watch("mode") === "strict_deny" ||
						form.watch("mode") === "auto") && (
						<>
							<FormField
								control={form.control}
								name="denyDomains"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Denied Domains</FormLabel>
										<FormControl>
											<Input placeholder="spam.com, marketing.io" {...field} />
										</FormControl>
										<FormDescription>
											Comma-separated list of domains to always ignore
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="denySenders"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Denied Senders</FormLabel>
										<FormControl>
											<Input
												placeholder="noreply@spam.com, ads@marketing.com"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Comma-separated list of email addresses to always ignore
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					<div className="flex justify-end">
						<Button type="submit" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
