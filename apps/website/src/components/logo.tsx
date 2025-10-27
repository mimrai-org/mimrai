import Image from "next/image";

export const Logo = ({ className }: { className?: string }) => {
	return (
		<Image
			src={"/logo.png"}
			alt="Mimir Logo"
			width={32}
			height={32}
			className={className}
		/>
	);
};
