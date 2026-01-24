import { useMutation } from "@tanstack/react-query";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { CopyPlusIcon, PencilIcon, SaveIcon, TrashIcon } from "lucide-react";
import { useTaskViewParams } from "@/hooks/use-task-view-params";
import { queryClient, trpc } from "@/utils/trpc";
import { DEFAULT_VIEWS, type DefaultTaskView } from "./default-views";
import type { TaskView } from "./list";

export const TaskViewContextMenu = ({
	view,
	children,
}: {
	view: TaskView | DefaultTaskView;
	children: React.ReactNode;
}) => {
	const { setParams } = useTaskViewParams();

	const { mutate: deleteView } = useMutation(
		trpc.taskViews.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.taskViews.get.queryOptions());
			},
		}),
	);

	const { mutate: createView } = useMutation(
		trpc.taskViews.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.taskViews.get.queryOptions());
			},
		}),
	);

	const editable = !DEFAULT_VIEWS.find((v) => v.id === view.id);

	return (
		<ContextMenu key={view.id}>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				{editable && "createdAt" in view && (
					<>
						<ContextMenuItem
							onSelect={() => {
								queryClient.setQueryData(
									trpc.taskViews.getById.queryKey({ id: view.id }),
									view,
								);
								setParams({
									viewId: view.id,
								});
							}}
						>
							<PencilIcon />
							Edit
						</ContextMenuItem>
						<ContextMenuItem
							onSelect={() => {
								createView({
									...view,
									name: `${view.name} Copy`,
									isDefault: false,
								});
							}}
						>
							<CopyPlusIcon />
							Duplicate
						</ContextMenuItem>
						<ContextMenuItem
							variant="destructive"
							onSelect={() =>
								deleteView({
									id: view.id,
								})
							}
						>
							<TrashIcon />
							Delete
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
};
