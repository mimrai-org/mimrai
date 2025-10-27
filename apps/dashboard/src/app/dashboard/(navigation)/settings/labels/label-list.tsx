"use client";
import { t } from "@mimir/locale";
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
import { LabelBadge } from "@mimir/ui/label-badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { EllipsisIcon, PlusIcon } from "lucide-react";
import { useLabelParams } from "@/hooks/use-task-label-params";
import { cn } from "@/lib/utils";
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

	const gridClasses = "grid grid-cols-[3fr_1fr_1fr_50px] gap-8 items-center";

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between">
					<div className="space-y-1">
						<CardTitle>{t("settings.labels.title")}</CardTitle>
						<CardDescription>
							{t("settings.labels.description")}
						</CardDescription>
					</div>
					<div>
						<Button
							size={"sm"}
							onClick={() => setParams({ createLabel: true })}
						>
							<PlusIcon />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ul className="">
					<li
						className={cn(
							gridClasses,
							"font-medium text-muted-foreground text-sm",
						)}
					>
						<span>{t("settings.labels.table.name")}</span>
						<span className="flex justify-end">
							{t("settings.labels.table.tasks")}
						</span>
						<span className="flex justify-end">
							{t("settings.labels.table.createdAt")}
						</span>
						<span />
					</li>
					{labels?.map((label) => (
						<li
							key={label.id}
							className={cn(gridClasses, "border-b py-2 text-sm last:border-0")}
						>
							<LabelBadge {...label} />
							<span className="flex justify-end">{label.taskCount}</span>
							<span className="flex justify-end">
								{format(new Date(label.createdAt), "PPP")}
							</span>
							<span>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size={"icon"} variant="ghost">
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
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
