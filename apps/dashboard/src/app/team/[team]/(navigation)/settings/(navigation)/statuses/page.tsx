"use client";
import { Button } from "@ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import { PlusIcon } from "lucide-react";
import { useStatusParams } from "@/hooks/use-status-params";
import { StatusesList } from "./statuses-list";

export default function Page() {
	const { setParams } = useStatusParams();

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div>
					<CardTitle>Statuses</CardTitle>
					<CardDescription>
						Manage the different statuses for your tasks.
					</CardDescription>
				</div>
				<div>
					<Button
						type="button"
						size="sm"
						onClick={() => setParams({ createStatus: true })}
					>
						<PlusIcon />
						Create Status
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<StatusesList />
			</CardContent>
		</Card>
	);
}
