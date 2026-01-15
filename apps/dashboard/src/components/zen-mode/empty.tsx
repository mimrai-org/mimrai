"use client";

import { Button } from "@ui/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/user-provider";

export const ZenModeEmpty = () => {
	const user = useUser();
	return (
		<div className="mx-auto flex h-screen max-w-md flex-col items-center justify-center">
			<h1 className="mb-2 text-center font-header text-4xl">
				Nothing to focus on
			</h1>
			<p className="text-center text-muted-foreground">
				You've cleared your current task queue.
				<br />
				Take a breath, or choose what deserves your attention next.
			</p>
			<div className="flex items-center gap-4">
				<Link href={`${user?.basePath}/board`} className="mt-6">
					<Button variant="ghost" type="button">
						Back to Board
					</Button>
				</Link>
				<Link href={`${user?.basePath}/board?createTask=true`} className="mt-6">
					<Button type="button">
						<PlusIcon />
						Create a new task
					</Button>
				</Link>
			</div>
		</div>
	);
};
