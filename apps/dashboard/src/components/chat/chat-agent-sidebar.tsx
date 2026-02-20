import { PopoverClose } from "@radix-ui/react-popover";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Command,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import {
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import {
	InfoIcon,
	PlusIcon,
	SettingsIcon,
	TriangleAlert,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useAgentParams } from "@/hooks/use-agent-params";
import { useDocuments } from "@/hooks/use-data";
import { useChatStore } from "@/store/chat";
import { queryClient, trpc } from "@/utils/trpc";
import { DocumentIcon } from "../documents/document-icon";
import { useDocumentPanel } from "../panels/document-panel";

export const ChatAgentSidebar = () => {
	const { setParams: setAgentParams } = useAgentParams();
	const documentPanel = useDocumentPanel();

	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounceValue(search, 300);
	const selectedAgentId = useChatStore((state) => state.selectedAgentId);
	const hasSelectedAgent = !!selectedAgentId;

	const { data: selectedAgent } = useQuery(
		trpc.agents.getById.queryOptions(
			{
				id: selectedAgentId!,
			},
			{
				enabled: hasSelectedAgent,
			},
		),
	);

	const { data: documentsForAgent } = useQuery(
		trpc.agents.getDocumentsForAgent.queryOptions(
			{
				agentId: selectedAgentId,
			},
			{
				enabled: hasSelectedAgent,
			},
		),
	);

	const { data: tools } = useQuery(
		trpc.agents.getToolsForAgent.queryOptions(
			{
				id: selectedAgentId!,
			},
			{
				enabled: hasSelectedAgent,
			},
		),
	);

	const { data: agentRecurringTasks } = useQuery(
		trpc.tasks.get.queryOptions(
			{
				assigneeId: selectedAgent?.userId ? [selectedAgent?.userId] : [],
				recurring: true,
			},
			{
				enabled: selectedAgent?.userId != null,
			},
		),
	);

	const { data: documents } = useDocuments({
		parentId: null,
		search: debouncedSearch,
		tree: false,
		pageSize: 10,
	});

	const { mutate: addDocumentToAgent } = useMutation(
		trpc.agents.addDocumentToAgent.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.agents.getDocumentsForAgent.queryOptions({
						agentId: selectedAgentId!,
					}),
				);
			},
		}),
	);

	const { mutate: removeDocumentFromAgent } = useMutation(
		trpc.agents.removeDocumentFromAgent.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.agents.getDocumentsForAgent.queryOptions({
						agentId: selectedAgentId!,
					}),
				);
			},
		}),
	);

	return (
		<>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								onClick={() => {
									setAgentParams({
										agentId: selectedAgentId!,
									});
								}}
							>
								<SettingsIcon />
								<span>Agent settings</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarGroup>
				<SidebarGroupLabel>Relevant documents</SidebarGroupLabel>
				<Popover>
					<PopoverTrigger asChild>
						<SidebarGroupAction>
							<PlusIcon />
						</SidebarGroupAction>
					</PopoverTrigger>
					<PopoverContent className="w-xs">
						<Command shouldFilter={false}>
							<CommandInput
								placeholder="Search documents..."
								value={search}
								onValueChange={(value) => setSearch(value)}
							/>
							<CommandList className="mt-2">
								{documents?.data.map((doc) => {
									const isLinked = documentsForAgent?.some(
										(linkedDoc) => linkedDoc.id === doc.id,
									);
									return (
										<PopoverClose key={doc.id} className="w-full">
											<CommandItem
												disabled={isLinked}
												onSelect={() => {
													addDocumentToAgent({
														agentId: selectedAgentId!,
														documentId: doc.id,
													});
												}}
											>
												<DocumentIcon icon={doc.icon} className="size-4" />
												<span className="truncate">{doc.name}</span>
											</CommandItem>
										</PopoverClose>
									);
								})}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>

				<SidebarGroupContent>
					<SidebarMenu>
						{documentsForAgent?.map((doc) => (
							<SidebarMenuItem key={doc.id} className="group">
								<SidebarMenuButton
									onClick={() => {
										documentPanel.open(doc.id);
									}}
								>
									<DocumentIcon icon={doc.icon} className="size-4" />
									<span>{doc.name}</span>
								</SidebarMenuButton>
								<SidebarMenuAction
									className="opacity-0 transition-opacity group-hover:opacity-100"
									onClick={() => {
										removeDocumentFromAgent({
											agentId: selectedAgentId!,
											documentId: doc.id,
										});
									}}
								>
									<XIcon />
								</SidebarMenuAction>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarGroup>
				<SidebarGroupLabel>Integrations</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{tools?.map((tool) => (
							<SidebarMenuItem key={tool.name}>
								<SidebarMenuButton className="capitalize">
									<span>{tool.name}</span>
								</SidebarMenuButton>
								<SidebarMenuAction>
									{tool.status === "error" && (
										<TriangleAlert className="text-destructive" />
									)}
								</SidebarMenuAction>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarGroup>
				<SidebarGroupLabel>Recurring tasks</SidebarGroupLabel>
				<Tooltip>
					<TooltipTrigger asChild>
						<SidebarGroupAction>
							<InfoIcon />
						</SidebarGroupAction>
					</TooltipTrigger>
					<TooltipContent className="max-w-xs">
						Ask your agent to create recurring tasks assigned to itself to see
						them here.
					</TooltipContent>
				</Tooltip>
				<SidebarGroupContent>
					<SidebarMenu>
						{agentRecurringTasks?.data.map((task) => (
							<SidebarMenuItem key={task.id}>
								<SidebarMenuButton>
									<span>{task.title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</>
	);
};
