"use client";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@mimir/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
import { useStatusParams } from "@/hooks/use-status-params";
import { StatusForm } from "../forms/status-form";

export const StatusCreateSheet = () => {
	const { createStatus, setParams } = useStatusParams();

	const isOpen = Boolean(createStatus);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Status</DialogTitle>
					<DialogDescription>
						Create a new status for your project.
					</DialogDescription>
				</DialogHeader>

				<StatusForm defaultValues={{}} />
			</DialogContent>
		</Dialog>
	);
};
