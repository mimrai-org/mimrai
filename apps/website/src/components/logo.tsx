import { cn } from "@ui/lib/utils";
import Image from "next/image";

export const Logo = ({
	className,
	width,
	height,
}: {
	className?: string;
	width?: number;
	height?: number;
}) => {
	return (
		<Image
			src={"/logo.png"}
			alt="Mimir Logo"
			width={width || 32}
			height={height || 32}
			className={cn(className, "invert dark:invert-0")}
		/>
	);
};
