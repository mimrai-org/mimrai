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
import { useLabelParams } from "@/hooks/use-task-label-params";
import { LabelList } from "./label-list";

export default function Page() {
	const { setParams } = useLabelParams();

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div>
					<CardTitle>Labels</CardTitle>
					<CardDescription>
						Manage the different labels for your tasks.
					</CardDescription>
				</div>
				<div>
					<Button
						type="button"
						size="sm"
						onClick={() => setParams({ createLabel: true })}
					>
						<PlusIcon />
						Create Label
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<LabelList />
			</CardContent>
		</Card>
	);
}
