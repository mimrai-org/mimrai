import { cn } from "@ui/lib/utils";
import Image from "next/image";

export const Logo = ({ className }: { className?: string }) => {
	return (
		<Image
			src={"/logo.png"}
			alt="Mimir Logo"
			width={32}
			height={32}
			loading="lazy"
			className={cn(className, "rounded-sm object-contain dark:invert")}
		/>
	);
};
