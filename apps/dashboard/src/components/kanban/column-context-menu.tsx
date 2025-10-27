"use client";
import type { RouterOutputs } from "@mimir/api/trpc";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@mimir/ui/context-menu";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useColumnParams } from "@/hooks/use-column-params";
import { queryClient, trpc } from "@/utils/trpc";

export const ColumnContextMenu = ({
	column,
	children,
}: {
	column: RouterOutputs["columns"]["get"]["data"][number];
	children: React.ReactNode;
}) => {
	const { setParams } = useColumnParams();

	const { mutate: deleteColumn } = useMutation(
		trpc.columns.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.columns.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onClick={() => {
						queryClient.setQueryData(
							trpc.columns.getById.queryKey({ id: column.id }),
							column,
						);
						setParams({ columnId: column.id });
					}}
				>
					Edit Column
				</ContextMenuItem>
				<ContextMenuItem
					variant="destructive"
					onClick={() => deleteColumn({ id: column.id })}
				>
					Delete Column
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
