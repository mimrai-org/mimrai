"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { cn } from "@ui/lib/utils";
import { EllipsisIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { StatusIcon } from "@/components/status-icon";
import { useStatusParams } from "@/hooks/use-status-params";
import { queryClient, trpc } from "@/utils/trpc";

export const StatusesList = () => {
	const { setParams } = useStatusParams();
	const { data } = useQuery(trpc.statuses.get.queryOptions());
	const { mutate: deleteStatus, isPending } = useMutation(
		trpc.statuses.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.statuses.get.queryOptions());
				toast.success("Status deleted successfully");
			},
		}),
	);

	const gridClass = "grid grid-cols-4 gap-4";

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Statuses</CardTitle>
					<Button size="sm" onClick={() => setParams({ createStatus: true })}>
						<PlusIcon />
						Add Status
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<ul>
					<li
						className={cn(
							gridClass,
							"border-b pb-4 font-medium text-muted-foreground text-xs",
						)}
					>
						<span>Name</span>
						<span>Description</span>
						<span>Type</span>
					</li>
					{data?.data.map((status) => (
						<li
							key={status.id}
							className={cn(
								gridClass,
								"items-center border-b py-2 text-sm last:border-0",
							)}
						>
							<span className="flex items-center gap-2">
								<StatusIcon className="inline size-4!" type={status.type} />
								{status.name}
							</span>
							<span className="text-muted-foreground">
								{status.description}
							</span>
							<span className="text-muted-foreground">
								{status.type.replaceAll("_", " ").toUpperCase()}
							</span>
							<div className="flex justify-end">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="sm" variant="ghost">
											<EllipsisIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => {
													queryClient.setQueryData(
														trpc.statuses.getById.queryKey({ id: status.id }),
														status,
													);
													setParams({
														statusId: status.id,
													});
												}}
											>
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												variant="destructive"
												disabled={isPending || status.type === "backlog"}
												onClick={() => deleteStatus({ id: status.id })}
											>
												Delete
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
