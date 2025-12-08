"use client";
import { Button } from "@ui/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, GithubIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { AbstractSphere, ParticleNetwork } from "../visuals/background-effects";

export const Hero: React.FC = () => {
	return (
		<section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
			<ParticleNetwork />
			<AbstractSphere />

			<div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
					className="mb-6 font-light text-5xl text-white leading-[1.1] tracking-tight md:text-7xl"
				>
					Task clarity at the <br />
					<span className="text-white">speed of focus.</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
					className="mb-10 max-w-2xl font-light text-lg text-zinc-400 leading-relaxed md:text-xl"
				>
					A smart companion that organizes your workflow, prioritizes tasks, and
					keeps your team aligned without the chaos.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
					className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
				>
					<Button variant="default" className="w-full min-w-[160px] sm:w-auto">
						Get Started <ArrowRight size={16} />
					</Button>
					<Link
						href="https://github.com/mimrai-org/mimrai"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button
							variant="secondary"
							className="w-full min-w-[160px] sm:w-auto"
						>
							<GithubIcon size={16} />
							Star on GitHub
						</Button>
					</Link>
				</motion.div>

				{/* Floating UI Card visual - Abstract Representation of "Smart Task" */}
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
					className="group relative mx-auto mt-20 hidden w-full max-w-4xl md:block"
				>
					<motion.div
						animate={{ y: [0, -10, 0] }}
						transition={{
							repeat: Number.POSITIVE_INFINITY,
							duration: 6,
							ease: "easeInOut",
						}}
						className="relative overflow-hidden bg-background p-1"
					>
						<Image
							src={"/images/board4.png"}
							alt="Abstract representation of a smart task"
							className="size-full object-cover"
							width={1366}
							height={768}
						/>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
};
