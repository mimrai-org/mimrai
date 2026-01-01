"use client";

const color =
	"dark:from-background dark:via-slate-900 dark:to-neutral-900 from-background via-slate-800 to-neutral-100 opacity-20";
export const ZenModeBackground = () => {
	return (
		<div className="pointer-events-none fixed inset-0 overflow-hidden">
			<div
				className={`-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 aspect-square size-[4000px] bg-radial-[50%_50%] ${color}`}
			/>
		</div>
	);
};
