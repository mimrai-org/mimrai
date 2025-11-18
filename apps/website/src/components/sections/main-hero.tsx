"use client";

import { motion, useAnimationFrame } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { createRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { WaitlistForm } from "../forms/waitlist-form";
import { Logo } from "../logo";

export const MainHero = () => {
	const constraintsRef = useRef<HTMLDivElement>(null);

	return (
		<motion.div
			className="relative flex h-screen flex-col border"
			ref={constraintsRef}
		>
			<header className="flex flex-col overflow-hidden px-8 pt-8 pb-8">
				<div className="flex flex-col items-start gap-2 space-y-4">
					<Link href={"/"}>
						<Logo
							className="size-8 rounded-full bg-primary p-1"
							width={96}
							height={96}
						/>
					</Link>
				</div>
			</header>

			<div className="-translate-y-1/2 pointer-events-none absolute inset-x-0 top-1/2" />
			{/* <div className="-translate-y-1/2 absolute top-1/2 right-0 h-[80%] w-[50%] overflow-hidden rounded-l-none"> */}

			<div
				className="-z-10 absolute inset-x-0 h-[50%] p-4 invert sm:inset-0 sm:h-full sm:p-0"
				style={{
					maskImage:
						"radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
				}}
			>
				<Image
					src={"/images/cover4.png"}
					alt="Cover Image"
					className="size-full scale-100 object-cover object-center"
					width={1400}
					height={800}
				/>
			</div>
			<div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
				<Flow className="-translate-y-[10%] pointer-events-none top-[10%] opacity-50" />
				<Flow
					className="-translate-y-[60%] pointer-events-none top-[60%] opacity-50"
					delay={8}
				/>
				<Flow
					className="-translate-y-[100%] pointer-events-none top-[100%] opacity-50"
					delay={5}
				/>
			</div>
			<div className="-z-5 pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,0,0,0),rgba(0,0,0,0.0)),url(https://grainy-gradients.vercel.app/noise.svg)] brightness-[10%] contrast-[170%]" />
			<div className="mt-auto flex flex-col sm:items-end sm:justify-between md:flex-row">
				<div className="space-y-4 p-4 sm:p-8">
					{/* <div className="w-fit space-y-4">
						<FakeMessage
							variant="user"
							body="We need to fix the login bug before the release. Maybe implement OAuth?"
						/>
						<FakeTask
							constraintsRef={constraintsRef}
							title="Implement OAuth"
							labels={["Feature"]}
						/>
						<FakeMessage
							variant="assistant"
							body="The task [Implement OAuth] has been created."
						/>
					</div> */}
					<h1 className="-z-8 relative flex flex-col font-runic text-4xl text-primary sm:text-6xl">
						Task management <br /> made simple.
					</h1>
					<p className="max-w-md text-sm sm:text-base">
						Just write what needs to be done — MIMRAI organizes everything
						automatically in the background.
					</p>
				</div>
				{/* <div className="flex items-center px-8 font-mono">{"10/28/2025"}</div> */}

				<div>
					<div className="p-4 sm:p-8">
						<div className="max-w-sm text-left sm:text-right">
							<WaitlistForm />
						</div>
					</div>
					{/* <div className="flex justify-end divide-x">
						<Link href={`${getAppUrl()}/sign-in`}>
							<Button type="button">
								Sign in
								<ChevronRight />
							</Button>
						</Link>
						<Link href={`${getAppUrl()}/sign-up`}>
							<Button type="button">
								Join
								<Badge variant={"secondary"} className="rounded-none">
									Waitlist
								</Badge>
							</Button>
						</Link>
					</div> */}
				</div>
			</div>
		</motion.div>
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
