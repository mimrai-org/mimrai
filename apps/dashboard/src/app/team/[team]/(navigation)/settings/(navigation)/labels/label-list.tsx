"use client";
import { t } from "@mimir/locale";
import { Button } from "@mimir/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@mimir/ui/dropdown-menu";
import { LabelBadge } from "@mimir/ui/label-badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { EllipsisIcon, PlusIcon } from "lucide-react";
import { useLabelParams } from "@/hooks/use-task-label-params";
import { queryClient, trpc } from "@/utils/trpc";

export const LabelList = () => {
	const { setParams } = useLabelParams();
	const { data: labels } = useQuery(trpc.labels.get.queryOptions({}));

	const { mutate: deleteLabel } = useMutation(
		trpc.labels.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.labels.get.queryOptions({}));
			},
		}),
	);

	return (
		<div className="text-xs">
			<div>
				{labels?.map((label) => (
					<div
						key={label.id}
						className="flex items-center gap-4 rounded-sm px-4 py-2 hover:bg-accent dark:hover:bg-accent/30"
					>
						<div className="flex min-w-0 flex-1 items-center gap-2">
							<div className="font-medium">
								<LabelBadge {...label} />
							</div>
						</div>
						<div className="text-muted-foreground text-xs">
							{label.taskCount} {t("settings.labels.table.tasks").toLowerCase()}
						</div>
						<div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size={"icon"} variant="ghost" className="size-5">
										<EllipsisIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onClick={() => {
											queryClient.setQueryData(
												trpc.labels.getById.queryKey({ id: label.id }),
												label,
											);
											setParams({ labelId: label.id });
										}}
									>
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem
										variant="destructive"
										onClick={() => deleteLabel({ id: label.id })}
									>
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				))}
				{labels?.length === 0 && (
					<div className="px-4 py-8 text-center text-muted-foreground">
						No labels yet
					</div>
				)}
				{!labels && (
					<div className="px-4 py-8 text-center text-muted-foreground">
						Loading labels...
					</div>
				)}
			</div>
		</div>
	);
};
