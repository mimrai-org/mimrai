import { AGENT_DEFAULT_MODEL, getModels } from "@mimir/utils/agents";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertTitle } from "@ui/components/ui/alert";
import { Button } from "@ui/components/ui/button";
import { DataSelectInput } from "@ui/components/ui/data-select-input";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
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
import { Switch } from "@ui/components/ui/switch";
import { Textarea } from "@ui/components/ui/textarea";
import { ToolCaseIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Editor } from "@/components/editor";
import { useAgentParams } from "@/hooks/use-agent-params";
import { invalidateMembersCache } from "@/hooks/use-data-cache-helpers";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";

const schema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	authorizeIntegrations: z.boolean(),
	activeToolboxes: z.string().array().optional(),
	model: z.string(),
	soul: z.string().optional(),
});

export const AgentForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const { setParams } = useAgentParams();
	const { data: allModels } = useQuery({
		queryKey: ["models"],
		queryFn: () => getModels(),
	});

	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			description: "",
			model: AGENT_DEFAULT_MODEL,
			authorizeIntegrations: true,
			activeToolboxes: [],
			soul: "",
			...defaultValues,
		},
	});

	const { mutate: createAgent, isPending: isCreating } = useMutation(
		trpc.agents.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.agents.get.infiniteQueryOptions({ pageSize: 20 }),
				);
				invalidateMembersCache();
				toast.success("Agent created");
				setParams(null);
			},
		}),
	);

	const { mutate: updateAgent, isPending: isUpdating } = useMutation(
		trpc.agents.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.agents.get.infiniteQueryOptions({ pageSize: 20 }),
				);
				invalidateMembersCache();
				toast.success("Agent updated");
				setParams(null);
			},
		}),
	);

	const isLoading = isCreating || isUpdating;

	const handleSubmit = (data: z.infer<typeof schema>) => {
		if (isLoading) return;
		if (defaultValues?.id) {
			updateAgent({
				id: defaultValues.id,
				...data,
			});
		} else {
			createAgent(data);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<div className="flex items-center gap-2">
									<Input placeholder="Name your agent" {...field} />
									<AssigneeAvatar name={field.value} email={field.value} />
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="model"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Model</FormLabel>
							<FormControl>
								<DropdownMenu>
									<DropdownMenuTrigger>
										<Input placeholder="Model" readOnly {...field} />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" className="max-w-sm">
										{allModels?.map((model, index) => (
											<DropdownMenuItem
												key={`${model.name}-${index}`}
												onSelect={() => {
													field.onChange(model.name);
												}}
												className="flex items-center"
											>
												<span className="flex-1 truncate">{model.name}</span>
												<div className="ml-auto">
													{model.inputCostUSD} / {model.outputCostUSD} USD
												</div>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="authorizeIntegrations"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Active Tools</FormLabel>
							<FormControl>
								<Alert className="flex items-center justify-between">
									<AlertTitle>
										Authorize this agent to use your integrations
									</AlertTitle>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</Alert>
							</FormControl>
							<FormMessage />
							<FormDescription>
								This will allow the agent to access your integrations and data
								on your behalf. Make sure to only authorize agents you trust.
							</FormDescription>
						</FormItem>
					)}
				/>

				<ActiveToolboxesFormField />

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description </FormLabel>
							<FormControl>
								<Textarea
									placeholder="Describe your agent's purpose"
									{...field}
								/>
							</FormControl>
							<FormMessage />
							<FormDescription>
								Internal use only. This description will help you identify the
								agent later.
							</FormDescription>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="soul"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Soul</FormLabel>
							<FormControl>
								<Editor
									placeholder="Define the soul of your agent..."
									className="rounded-sm border p-2 [&>.tiptap]:min-h-32"
									onChange={field.onChange}
									autoFocus={false}
									value={field.value}
								/>
							</FormControl>
							<FormMessage />
							<FormDescription>
								The soul defines the core personality and behavior of the agent.
							</FormDescription>
						</FormItem>
					)}
				/>

				<div className="flex items-center justify-end">
					<Button className="" type="submit" disabled={isLoading}>
						{defaultValues?.id ? "Update Agent" : "Create Agent"}
					</Button>
				</div>
			</form>
		</Form>
	);
};

const ActiveToolboxesFormField = () => {
	const form = useFormContext<z.infer<typeof schema>>();

	return (
		<FormField
			control={form.control}
			name="activeToolboxes"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Active Toolboxes</FormLabel>
					<FormControl>
						<DataSelectInput
							queryOptions={trpc.agents.getToolboxes.queryOptions()}
							value={field.value || null}
							onChange={(value) => field.onChange(value || null)}
							getValue={(item) => item}
							getLabel={(item) => item || "All Toolboxes"}
							variant={"outline"}
							placeholder="All Toolboxes"
							multiple
							clearable
							renderClear={() => (
								<div className="flex items-center gap-2">
									<ToolCaseIcon className="size-4" />
									All Toolboxes
								</div>
							)}
							renderItem={(item) => (
								<div className="flex items-center gap-2">
									<ToolCaseIcon className="size-4" />
									{item}
								</div>
							)}
							renderMultiple={(items) => {
								return items.map((item) => (
									<div
										key={item}
										className="flex items-center gap-2 rounded bg-accent px-2 py-1 text-accent-foreground text-xs"
									>
										<ToolCaseIcon className="size-4" />
										{item}
									</div>
								));
							}}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
