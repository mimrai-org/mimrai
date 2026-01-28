"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@mimir/ui/alert-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/ui/alert";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/ui/select";
import {
	AlertTriangle,
	Check,
	Copy,
	Key,
	Loader2,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const createApiKeySchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	expiresIn: z.enum(["never", "30d", "90d", "1y"]).default("never"),
});

export function ApiKeysList() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newApiKey, setNewApiKey] = useState<string | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Fetch user's API keys
	const { data: apiKeys, isLoading } = useQuery(
		trpc.apiKeys.list.queryOptions({}),
	);

	// Create new API key mutation
	const { mutate: createApiKey, isPending: isCreating } = useMutation(
		trpc.apiKeys.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries(trpc.apiKeys.list.queryOptions({}));
				if (data?.key) {
					setNewApiKey(data.key);
				}
				toast.success("API key created");
			},
			onError: () => {
				toast.error("Failed to create API key");
			},
		}),
	);

	// Delete API key mutation
	const { mutate: deleteApiKey, isPending: isDeleting } = useMutation(
		trpc.apiKeys.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.apiKeys.list.queryOptions({}));
				toast.success("API key deleted");
			},
			onError: () => {
				toast.error("Failed to delete API key");
			},
		}),
	);

	const form = useZodForm(createApiKeySchema, {
		defaultValues: {
			name: "",
			expiresIn: "never",
		},
	});

	const handleCreate = (data: z.infer<typeof createApiKeySchema>) => {
		// Calculate expiration in seconds
		let expiresIn: number | undefined;
		if (data.expiresIn !== "never") {
			const durations: Record<string, number> = {
				"30d": 30 * 24 * 60 * 60, // 30 days in seconds
				"90d": 90 * 24 * 60 * 60, // 90 days in seconds
				"1y": 365 * 24 * 60 * 60, // 1 year in seconds
			};
			expiresIn = durations[data.expiresIn];
		}

		createApiKey({
			name: data.name,
			expiresIn,
		});
	};

	const handleCopy = async (text: string, field: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 2000);
		toast.success("Copied to clipboard");
	};

	const handleCloseSecret = () => {
		setNewApiKey(null);
		setIsCreateOpen(false);
		form.reset();
	};

	const formatDate = (date: Date | string | null) => {
		if (!date) return "Never";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-lg">API Keys</h2>
					<p className="text-muted-foreground text-sm">
						Manage API keys for MCP integrations and external applications
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 size-4" />
							Create API Key
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-max!">
						{newApiKey ? (
							<>
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<Check className="size-5 text-green-500" />
										API Key Created Successfully
									</DialogTitle>
									<DialogDescription>
										Save your API key now. You won't be able to see it again.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<Alert variant="destructive">
										<AlertTriangle />
										<AlertTitle>
											Make sure to copy your API key now. You won't be able to
											see it again!
										</AlertTitle>
										<AlertDescription>
											Store it securely, as it provides access to your Mimrai
											account.
										</AlertDescription>
									</Alert>
									<div className="space-y-2">
										<span className="font-medium text-sm">API Key</span>
										<div className="flex items-center gap-2">
											<code className="flex-1 break-all rounded-md border bg-muted p-3 font-mono text-sm">
												{newApiKey}
											</code>
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleCopy(newApiKey, "key")}
											>
												{copiedField === "key" ? (
													<Check className="size-4" />
												) : (
													<Copy className="size-4" />
												)}
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<span className="font-medium text-sm">
											VS Code MCP Configuration
										</span>
										<pre className="overflow-x-auto rounded-md border bg-muted p-3 font-mono text-xs">
											{JSON.stringify(
												{
													servers: {
														mimrai: {
															url: `${process.env.NEXT_PUBLIC_SERVER_URL}/mcp`,
															type: "http",
															headers: {
																"x-api-key": newApiKey,
															},
														},
													},
												},
												null,
												2,
											)}
										</pre>
										<Button
											variant="outline"
											size="sm"
											className="w-full"
											onClick={() =>
												handleCopy(
													JSON.stringify(
														{
															servers: {
																mimrai: {
																	url: `${process.env.NEXT_PUBLIC_SERVER_URL}/mcp`,
																	type: "http",
																	headers: {
																		"x-api-key": newApiKey,
																	},
																},
															},
														},
														null,
														2,
													),
													"config",
												)
											}
										>
											{copiedField === "config" ? (
												<>
													<Check className="mr-2 size-4" />
													Copied!
												</>
											) : (
												<>
													<Copy className="mr-2 size-4" />
													Copy MCP Config
												</>
											)}
										</Button>
									</div>
								</div>
								<DialogFooter>
									<Button onClick={handleCloseSecret}>Done</Button>
								</DialogFooter>
							</>
						) : (
							<>
								<DialogHeader>
									<DialogTitle>Create API Key</DialogTitle>
									<DialogDescription>
										Create a new API key to connect MCP clients like VS Code,
										Cursor, or other AI assistants to your Mimrai account.
									</DialogDescription>
								</DialogHeader>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(handleCreate)}
										className="space-y-4"
									>
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Name</FormLabel>
													<FormControl>
														<Input placeholder="VS Code MCP" {...field} />
													</FormControl>
													<FormDescription>
														A friendly name to identify this API key
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="expiresIn"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Expiration</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select expiration" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="never">
																Never expires
															</SelectItem>
															<SelectItem value="30d">30 days</SelectItem>
															<SelectItem value="90d">90 days</SelectItem>
															<SelectItem value="1y">1 year</SelectItem>
														</SelectContent>
													</Select>
													<FormDescription>
														When the API key should expire
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
										<DialogFooter>
											<Button
												type="button"
												variant="outline"
												onClick={() => setIsCreateOpen(false)}
											>
												Cancel
											</Button>
											<Button type="submit" disabled={isCreating}>
												{isCreating && (
													<Loader2 className="mr-2 size-4 animate-spin" />
												)}
												Create
											</Button>
										</DialogFooter>
									</form>
								</Form>
							</>
						)}
					</DialogContent>
				</Dialog>
			</div>

			{!apiKeys || apiKeys.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Key className="mb-4 size-12 text-muted-foreground/50" />
						<h3 className="mb-2 font-medium">No API Keys</h3>
						<p className="mb-4 max-w-sm text-center text-muted-foreground text-sm">
							Create an API key to connect MCP clients like VS Code or Cursor to
							your Mimrai tasks.
						</p>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 size-4" />
							Create Your First API Key
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{apiKeys.map((apiKey) => (
						<Card key={apiKey.id}>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="flex items-center gap-2 text-base">
											{apiKey.name || "Unnamed Key"}
											{!apiKey.enabled && (
												<Badge variant="secondary">Disabled</Badge>
											)}
											{apiKey.expiresAt &&
												new Date(apiKey.expiresAt) < new Date() && (
													<Badge variant="destructive">Expired</Badge>
												)}
										</CardTitle>
									</div>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="ghost" size="icon" disabled={isDeleting}>
												<Trash2 className="size-4 text-muted-foreground" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Delete API Key?</AlertDialogTitle>
												<AlertDialogDescription>
													This will permanently delete the API key and revoke
													all access. Any applications using this key will stop
													working immediately.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => deleteApiKey({ id: apiKey.id })}
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
												>
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex gap-6 text-sm">
									<div>
										<span className="font-medium text-muted-foreground text-xs">
											Key Prefix
										</span>
										<div className="mt-1">
											<code className="rounded border bg-muted px-2 py-1 font-mono text-xs">
												{apiKey.start || apiKey.prefix || "mimir_"}***
											</code>
										</div>
									</div>
									<div>
										<span className="font-medium text-muted-foreground text-xs">
											Created
										</span>
										<p className="mt-1 text-sm">
											{formatDate(apiKey.createdAt)}
										</p>
									</div>
									<div>
										<span className="font-medium text-muted-foreground text-xs">
											Expires
										</span>
										<p className="mt-1 text-sm">
											{formatDate(apiKey.expiresAt)}
										</p>
									</div>
								</div>
								{apiKey.permissions && (
									<div>
										<span className="font-medium text-muted-foreground text-xs">
											Permissions
										</span>
										<div className="mt-1 flex flex-wrap gap-1">
											{Object.entries(apiKey.permissions).map(
												([resource, actions]) =>
													(actions as string[]).map((action) => (
														<Badge
															key={`${resource}-${action}`}
															variant="outline"
															className="text-xs"
														>
															{resource}:{action}
														</Badge>
													)),
											)}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<Card className="bg-muted/50">
				<CardHeader>
					<CardTitle className="text-sm">MCP Integration Guide</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<p className="text-muted-foreground">
						To connect an MCP client to your Mimrai account:
					</p>
					<ol className="list-inside list-decimal space-y-2 text-muted-foreground">
						<li>Create an API key above</li>
						<li>
							Add the MCP server configuration to your client (VS Code, Cursor,
							etc.)
						</li>
						<li>
							Set the MCP endpoint to:{" "}
							<code className="rounded bg-background px-1.5 py-0.5 text-xs">
								{process.env.NEXT_PUBLIC_SERVER_URL}/mcp
							</code>
						</li>
						<li>
							Add the{" "}
							<code className="rounded bg-background px-1.5 py-0.5 text-xs">
								x-api-key
							</code>{" "}
							header with your API key
						</li>
					</ol>
					<div className="mt-4 rounded-md border bg-background p-3">
						<p className="mb-2 font-medium text-xs">
							Example VS Code .vscode/mcp.json:
						</p>
						<pre className="overflow-x-auto font-mono text-xs">
							{JSON.stringify(
								{
									servers: {
										mimrai: {
											url: `${process.env.NEXT_PUBLIC_SERVER_URL}/mcp`,
											type: "http",
											headers: {
												"x-api-key": "YOUR_API_KEY",
											},
										},
									},
								},
								null,
								2,
							)}
						</pre>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
