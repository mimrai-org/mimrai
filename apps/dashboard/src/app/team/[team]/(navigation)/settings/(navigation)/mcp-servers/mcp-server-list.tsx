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
import { Badge } from "@mimir/ui/badge";
import { Button } from "@mimir/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@mimir/ui/dropdown-menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	EllipsisIcon,
	Loader2,
	PlusIcon,
	ServerIcon,
	WifiIcon,
	WifiOffIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useMcpServerParams } from "@/hooks/use-mcp-server-params";
import { queryClient, trpc } from "@/utils/trpc";

export const McpServerList = () => {
	const { setParams } = useMcpServerParams();
	const { data: servers, isLoading } = useQuery(
		trpc.mcpServers.list.queryOptions({}),
	);

	const { mutate: deleteMcpServer } = useMutation(
		trpc.mcpServers.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.mcpServers.list.queryOptions({}));
				toast.success("MCP server deleted");
			},
			onError: () => {
				toast.error("Failed to delete MCP server");
			},
		}),
	);

	return (
		<Card>
			<CardContent className="text-sm">
				{isLoading ? (
					<div className="flex items-center justify-center p-8">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : !servers || servers.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<ServerIcon className="mb-4 size-12 text-muted-foreground" />
						<h3 className="mb-2 font-medium text-lg">No MCP servers yet</h3>
						<p className="mb-4 max-w-sm text-muted-foreground">
							Add MCP servers to give your AI assistant access to external tools
							and services.
						</p>
						<Button
							onClick={() => setParams({ createMcpServer: true })}
							className="w-fit"
						>
							Create MCP Server
						</Button>
					</div>
				) : (
					<div>
						{servers.map((server) => (
							<div
								key={server.id}
								className="flex items-center justify-between rounded-sm px-4 py-4 hover:bg-accent dark:hover:bg-accent/30"
							>
								<div className="flex items-center gap-3">
									<div className="flex size-9 items-center justify-center rounded-md bg-muted">
										<ServerIcon className="size-4 text-muted-foreground" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<span className="font-medium text-sm">{server.name}</span>
											<Badge
												variant={server.isActive ? "default" : "secondary"}
											>
												{server.isActive ? (
													<>
														<WifiIcon className="mr-1 size-3" />
														Active
													</>
												) : (
													<>
														<WifiOffIcon className="mr-1 size-3" />
														Inactive
													</>
												)}
											</Badge>
											<Badge variant="outline">{server.transport}</Badge>
										</div>
										{server.description && (
											<p className="mt-0.5 text-muted-foreground text-xs">
												{server.description}
											</p>
										)}
										<p className="mt-0.5 font-mono text-muted-foreground text-xs">
											{(server.config as { url: string }).url}
										</p>
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="icon" variant="ghost">
											<EllipsisIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => setParams({ mcpServerId: server.id })}
										>
											Edit
										</DropdownMenuItem>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<DropdownMenuItem
													variant="destructive"
													onSelect={(e) => e.preventDefault()}
												>
													Delete
												</DropdownMenuItem>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Delete MCP Server?
													</AlertDialogTitle>
													<AlertDialogDescription>
														This will permanently remove "{server.name}" and the
														AI will lose access to its tools.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => deleteMcpServer({ id: server.id })}
														className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
													>
														Delete
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};
