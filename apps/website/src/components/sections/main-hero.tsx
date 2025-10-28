"use client";

import { getAppUrl } from "@mimir/utils/envs";
import { Button } from "@ui/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useAnimationFrame, useMotionValueEvent, useTime } from "motion/react";
import Link from "next/link";
import { createRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const MainHero = () => {
	return (
		<div>
			<div className="relative bg-background invert">
				<section className="section-center flex flex-col py-20">
					<h1 className="font-runic text-6xl sm:text-8xl">MIMRAI</h1>
					<p className="max-w-sm text-base text-muted-foreground sm:text-lg">
						Stop over-configuring. Just write what needs to be done — MIMRAI
						turns messages into organized tasks automatically.
					</p>
				</section>
				<Flow className="-translate-y-[10%] top-[10%] opacity-30" />
				<Flow className="-translate-y-[60%] top-[60%] opacity-30" delay={8} />
				<Flow className="-translate-y-[100%] top-[120%] opacity-30" delay={5} />
			</div>
			<div className="flex justify-between invert">
				<div className="flex items-center px-4 font-mono">{"10/28/2025"}</div>
				<div className="flex">
					<Link href={`${getAppUrl()}/sign-in`}>
						<Button type="button">
							Sign in
							<ChevronRight />
						</Button>
					</Link>
					<Link href={`${getAppUrl()}/sign-up`}>
						<Button type="button">Sign up</Button>
					</Link>
				</div>
			</div>
		</div>
	);
};

const Flow = ({
	className,
	delay = 0,
}: {
	className?: string;
	delay?: number;
}) => {
	const volume = 50;
	const points = useRef<Array<React.Ref<HTMLDivElement>>>(
		Array.from({ length: volume }, () => createRef()),
	);

	const fn = (x: number) => {
		return Math.sin(x / 100) * 30 + 50;
	};

	useAnimationFrame((latest) => {
		const margin = 10;
		// const size = 8;
		// const length = volume * (margin + size);
		const screenWidth = window.innerWidth;
		// const x = ((latest * 0.4) % (length * 2)) - length;
		const x = latest * 0.4 + delay * 100;
		points.current.forEach((pointRef, idx) => {
			if (!pointRef) return;
			const offsetX = (x + idx * margin) % screenWidth;
			const offsetY = fn(offsetX);
			const element = pointRef as { current: HTMLDivElement | null };
			if (element.current) {
				element.current.style.transform = `translateX(${offsetX}px) translateY(${offsetY}px)`;
			}
		});
	});

	return (
		<div
			className={cn(
				"-translate-y-1/2 absolute top-1/2 h-[200px] w-full overflow-hidden",
				className,
			)}
		>
			{points.current.map((ref, idx) => (
				<Point key={idx} ref={points.current[idx]} />
			))}
		</div>
	);
};

const Point = ({ ref }: { ref?: React.Ref<HTMLDivElement> }) => {
	return (
		<div
			className="absolute h-[1px] w-[5px] rounded-full bg-primary"
			ref={ref}
		/>
	);
};
