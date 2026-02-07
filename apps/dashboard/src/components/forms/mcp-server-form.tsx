"use client";

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
import { Textarea } from "@mimir/ui/textarea";
import { getApiUrl } from "@mimir/utils/envs";
import { useMutation } from "@tanstack/react-query";
import { KeyRoundIcon, Loader2, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useMcpServerParams } from "@/hooks/use-mcp-server-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const headerSchema = z.object({
	key: z.string().min(1, "Header name is required"),
	value: z.string().min(1, "Header value is required"),
});

const schema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name is required").max(100),
	description: z.string().max(500).optional(),
	transport: z.enum(["http", "sse"]).default("http"),
	url: z.string().url("Must be a valid URL"),
	headers: z.array(headerSchema).optional().default([]),
	scopes: z.string().optional(),
});

export const McpServerForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const [error, setError] = useState<string | null>(null);
	const { setParams } = useMcpServerParams();

	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			description: "",
			transport: "http",
			url: "",
			headers: [],
			scopes: "",
			...defaultValues,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "headers",
	});

	const { mutateAsync: createServer, isPending: isCreating } = useMutation(
		trpc.mcpServers.create.mutationOptions(),
	);

	const { mutateAsync: updateServer, isPending: isUpdating } = useMutation(
		trpc.mcpServers.update.mutationOptions(),
	);

	const isPending = isCreating || isUpdating;

	const isAuthRequired = async (data: z.infer<typeof schema>) => {
		setError(null);
		try {
			const headers: Record<string, string> = {};
			for (const header of data.headers ?? []) {
				headers[header.key] = header.value;
			}

			const response = await fetch(data.url, {
				method: "HEAD",
			});

			console.log(`MCP server responded with status ${response.status}`);
			if (!response.ok) {
				if (response.status === 401) {
					return true; // Still consider it valid since the server is reachable
				}

				throw new Error(
					`Failed to connect to MCP server. Status: ${response.status}`,
				);
			}
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError("An unknown error occurred during validation");
			}
			return true;
		}
		setError(null);
		return false;
	};

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		const headers: Record<string, string> = {};
		for (const header of data.headers ?? []) {
			headers[header.key] = header.value;
		}

		const config = {
			url: data.url,
			headers: Object.keys(headers).length > 0 ? headers : undefined,
			scopes: data.scopes
				? data.scopes
						.split(/[,\s]+/)
						.map((s) => s.trim())
						.filter(Boolean)
				: undefined,
		};

		if (data.id) {
			await updateServer({
				id: data.id,
				name: data.name,
				description: data.description,
				transport: data.transport,
				config,
			});
		} else {
			const shouldAuth = await isAuthRequired(data);
			const createdServer = await createServer({
				name: data.name,
				description: data.description,
				transport: data.transport,
				config,
			});
			if (shouldAuth) {
				handleAuthenticate(createdServer.id);
			} else {
				setParams({
					mcpServerId: createdServer.id,
				});
			}
		}

		queryClient.invalidateQueries(trpc.mcpServers.list.queryOptions({}));
	};

	const handleAuthenticate = (mcpServerId?: string) => {
		const id = mcpServerId ?? form.getValues("id");
		if (!id) return;
		window.location.href = `${getApiUrl()}/api/mcp-server-auth/${id}/authorize`;
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="my-mcp-server" {...field} />
							</FormControl>
							<FormDescription>
								A unique name to identify this MCP server.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									placeholder="What tools does this server provide?"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="transport"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Transport</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select transport type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="http">HTTP (Streamable)</SelectItem>
									<SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="url"
					render={({ field }) => (
						<FormItem>
							<FormLabel>URL</FormLabel>
							<FormControl>
								<Input placeholder="https://example.com/mcp" {...field} />
							</FormControl>
							<FormDescription>The MCP server endpoint URL.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<FormLabel>Headers</FormLabel>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => append({ key: "", value: "" })}
						>
							<PlusIcon className="mr-1 size-3" />
							Add Header
						</Button>
					</div>
					{fields.map((field, index) => (
						<div key={field.id} className="flex items-start gap-2">
							<FormField
								control={form.control}
								name={`headers.${index}.key`}
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormControl>
											<Input placeholder="Header name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`headers.${index}.value`}
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormControl>
											<Input
												placeholder="Header value"
												type="password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => remove(index)}
							>
								<Trash2Icon className="size-4" />
							</Button>
						</div>
					))}
				</div>

				<FormField
					control={form.control}
					name="scopes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>OAuth Scopes</FormLabel>
							<FormControl>
								<Input placeholder="read write admin" {...field} />
							</FormControl>
							<FormDescription>
								Space or comma-separated OAuth scopes to request. Leave empty to
								request all available scopes.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{error && <div className="text-red-500 text-sm">{error}</div>}

				<div className="flex justify-end gap-2 pt-2">
					{defaultValues?.id && (
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								handleAuthenticate();
							}}
						>
							<KeyRoundIcon className="size-4" />
							Authenticate
						</Button>
					)}
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
