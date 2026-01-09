"use client";

import Image from "next/image";

const color =
	"dark:from-background dark:via-slate-900 dark:to-neutral-900 from-background via-slate-800 to-neutral-100 opacity-20";
export const ZenModeBackground = () => {
	return (
		<div className="pointer-events-none fixed inset-0 overflow-hidden">
			<div
				className={`-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 aspect-square size-[4000px] bg-radial-[50%_50%] ${color}`}
			/>
			{/* <Image
				src="/abstract1.png"
				alt=""
				className="-z-10 absolute bottom-0 h-full w-full object-cover opacity-20 blur-3xl dark:opacity-1"
				width={1920}
				height={1080}
			/> */}
		</div>
	);
};
