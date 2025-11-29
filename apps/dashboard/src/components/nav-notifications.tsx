import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { BellIcon } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/utils/trpc";

export const NavNotifications = () => {
	const { data } = useQuery(trpc.activities.hasNew.queryOptions());

	return (
		<Link href="/dashboard/notifications">
			<Button
				size={"sm"}
				className="relative size-8 rounded-full"
				type="button"
				variant={"ghost"}
			>
				<BellIcon />
				{data && (
					<div className="absolute top-0 right-0 size-2 rounded-full bg-primary" />
				)}
			</Button>
		</Link>
	);
};
