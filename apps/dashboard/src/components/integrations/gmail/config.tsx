"use client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { Textarea } from "@ui/components/ui/textarea";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import type { IntegrationConfigFormProps } from "../components";

const schema = z.object({
	sendersWhitelist: z.array(z.string().email()).optional(),
	sendersBlacklist: z.array(z.string().email()).optional(),
	subjectMatching: z.string().optional(),
	bodyMatching: z.string().optional(),
});

export const ConfigIntegrationGmailForm = ({
	integration,
}: IntegrationConfigFormProps) => {
	const config = integration.installedUserIntegration?.config || {};
	const form = useZodForm(schema, {
		defaultValues: {
			sendersWhitelist: config.filters?.sendersWhitelist || [],
			sendersBlacklist: config.filters?.sendersBlacklist || [],
			subjectMatching: config.subjectMatching || "",
			bodyMatching: config.bodyMatching || "",
		},
	});

	const { mutate } = useMutation(
		trpc.integrations.updateLinkedUser.mutationOptions({
			onMutate: () => {
				toast.loading("Updating configuration...", {
					id: "update-gmail-config",
				});
			},
			onSuccess: (data) => {
				toast.success("Configuration updated successfully", {
					id: "update-gmail-config",
				});
			},
			onError: (error) => {
				toast.error("Failed to update configuration", {
					id: "update-gmail-config",
				});
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		mutate({
			integrationType: "gmail",
			config: data,
		});
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<FormField
					name="sendersWhitelist"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Senders Whitelist (comma separated emails)</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									value={field.value?.join(", ") || ""}
									onChange={(e) =>
										field.onChange(
											e.target.value
												.split(",")
												.map((email) => email.trim())
												.filter((email) => email.length > 0),
										)
									}
									placeholder="e.g. example@gmail.com, another@example.com"
								/>
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					name="sendersBlacklist"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Senders Blacklist (comma separated emails)</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									value={field.value?.join(", ") || ""}
									onChange={(e) =>
										field.onChange(
											e.target.value
												.split(",")
												.map((email) => email.trim())
												.filter((email) => email.length > 0),
										)
									}
									placeholder="e.g. example@gmail.com, another@example.com"
								/>
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					name="subjectMatching"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Subject Matching (keyword)</FormLabel>
							<FormControl>
								<Input {...field} placeholder="e.g. Meeting, Invoice" />
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					name="bodyMatching"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Body Matching (keyword)</FormLabel>
							<FormControl>
								<Input {...field} placeholder="e.g. Agenda, Payment" />
							</FormControl>
						</FormItem>
					)}
				/>
				<div className="flex items-center justify-end gap-2">
					<Button>
						<SaveIcon />
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
