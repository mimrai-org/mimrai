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
import { ColumnIcon } from "@/components/column-icon";
import { useColumnParams } from "@/hooks/use-column-params";
import { queryClient, trpc } from "@/utils/trpc";

export const ColumnsList = () => {
	const { setParams } = useColumnParams();
	const { data } = useQuery(trpc.columns.get.queryOptions());
	const { mutate: deleteColumn, isPending } = useMutation(
		trpc.columns.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.columns.get.queryOptions());
				toast.success("Column deleted successfully");
			},
		}),
	);

	const gridClass = "grid grid-cols-4 gap-4";

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Columns</CardTitle>
					<Button size="sm" onClick={() => setParams({ createColumn: true })}>
						<PlusIcon />
						Add Column
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
					{data?.data.map((column) => (
						<li
							key={column.id}
							className={cn(
								gridClass,
								"items-center border-b py-2 text-sm last:border-0",
							)}
						>
							<span className="flex items-center gap-2">
								<ColumnIcon className="inline size-4!" type={column.type} />
								{column.name}
							</span>
							<span className="text-muted-foreground">
								{column.description}
							</span>
							<span className="text-muted-foreground">
								{column.type.replaceAll("_", " ").toUpperCase()}
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
														trpc.columns.getById.queryKey({ id: column.id }),
														column,
													);
													setParams({
														columnId: column.id,
													});
												}}
											>
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												variant="destructive"
												disabled={isPending || column.type === "backlog"}
												onClick={() => deleteColumn({ id: column.id })}
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
