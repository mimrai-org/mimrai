import { Button } from "@ui/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/ui/dialog";
import { EyeIcon, RocketIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTaskParams } from "@/hooks/use-task-params";

export const WorkConfirmDialogTrigger = ({
	taskId,
	children,
	className,
	asChild = false,
}: {
	taskId: string;
	children: React.ReactNode;
	className?: string;
	asChild?: boolean;
}) => {
	const { setParams } = useTaskParams();
	const router = useRouter();
	return (
		<Dialog>
			<DialogTrigger asChild={asChild} className={className}>
				{children}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Start working on this task?</DialogTitle>
					<div className="mb-2 text-muted-foreground text-sm">
						Once you confirm, the following will happen:
						<ul className="mt-2 list-disc pl-5">
							<li>
								The task status will be moved to the "In Progress" column.
							</li>
							<li>Your work session will begin.</li>
						</ul>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="secondary">
								Cancel
							</Button>
						</DialogClose>
						<Button
							variant="secondary"
							onClick={() => {
								setParams({ taskId });
							}}
						>
							<EyeIcon />
							Just a peek
						</Button>
						<Button
							onClick={() => {
								router.push(`/dashboard/workstation/${taskId}`);
							}}
							type="button"
						>
							<RocketIcon />
							Let's go
						</Button>
					</DialogFooter>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};
