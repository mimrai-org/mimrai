"use client";

import { getAppUrl } from "@mimir/utils/envs";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Github, Sparkles } from "lucide-react";
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
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="mb-8"
				>
					<Badge
						variant="outline"
						className="gap-2 rounded-full border-white/10 bg-white/5 py-1 pr-3 pl-2 font-medium text-zinc-300"
					>
						<span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
						Introducing Mimir • Your AI Companion
						<ChevronRight size={12} className="ml-1 text-zinc-500" />
					</Badge>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
					className="mb-6 font-light text-5xl text-white leading-[1.1] tracking-tight md:text-7xl"
				>
					Rethink how you <br />
					<span className="text-zinc-400">interact with work.</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
					className="mb-10 max-w-2xl font-light text-lg text-zinc-400 leading-relaxed md:text-xl"
				>
					More than a project manager. Mimrai is an intelligent companion that
					understands your team's rhythm, filters operational noise, and guides
					you through complexity with calm and focus.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
					className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
				>
					<Link href={`${getAppUrl()}/sign-in`}>
						<Button
							size="lg"
							className="w-full min-w-[160px] gap-2 rounded-full sm:w-auto"
						>
							Meet Mimir <ArrowRight size={16} />
						</Button>
					</Link>

					<Button
						variant="secondary"
						size="lg"
						className="w-full min-w-[160px] gap-2 rounded-full sm:w-auto"
						onClick={() =>
							window.open("https://github.com/mimrai-org/mimrai", "_blank")
						}
					>
						<Github size={16} />
						Star on GitHub
					</Button>
				</motion.div>

				{/* Floating UI Card visual - Mimir Interaction */}
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
						className="relative overflow-hidden rounded-xl border border-white/10 bg-surfaceHighlight p-1 shadow-2xl"
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
