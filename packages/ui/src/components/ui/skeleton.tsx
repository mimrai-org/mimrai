import { cn } from "@ui/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-sm bg-accent", className)}
			{...props}
		/>
	);
}

export { Skeleton };
