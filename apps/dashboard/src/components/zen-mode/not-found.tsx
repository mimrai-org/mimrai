"use client";
import { Button } from "@ui/components/ui/button";
import { ChevronLeftIcon, CircleQuestionMarkIcon } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/user-provider";

export const ZenModeNotFound = () => {
	const user = useUser();
	if (!user) {
		return null;
	}

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="space-y-4 text-center">
				<CircleQuestionMarkIcon className="mx-auto size-8 text-muted-foreground" />
				<h2 className="font-semibold text-4xl">Task Not Found</h2>
				<p className="max-w-sm text-muted-foreground">
					The task you are looking for is not assigned to you or does not exist.
				</p>
				<Link href={`${user?.basePath}/board`}>
					<Button>
						<ChevronLeftIcon />
						Go Back to Board
					</Button>
				</Link>
			</div>
		</div>
	);
};
