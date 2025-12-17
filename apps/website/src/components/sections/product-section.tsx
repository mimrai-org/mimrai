"use client";
import { getAppUrl } from "@mimir/utils/envs";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import { motion } from "framer-motion";
import {
	Bot,
	Layers,
	Sparkles,
	SparklesIcon,
	WindIcon,
	Zap,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Waveform } from "../visuals/background-effects";

export const ProductSection: React.FC = () => {
	return (
		<section
			id="product"
			className="relative overflow-hidden bg-background py-32"
		>
			<div className="absolute top-0 left-0 h-px w-full bg-white/10" />

			<div className="relative z-10 mx-auto max-w-7xl px-6">
				<div className="mb-20 max-w-3xl">
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="mb-6 font-light text-4xl text-white md:text-5xl"
					>
						Intelligent Guidance.
						<br />
						Radical Focus.
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="mb-8 font-light text-xl text-zinc-400"
					>
						Mimrai isn't just a list. It acts as a filter for your attention,
						highlighting what matters and automating the coordination that
						usually slows you down.
					</motion.p>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="flex gap-4"
					>
						<Link href={`${getAppUrl()}/sign-in`}>
							<Button variant="default">Get Started</Button>
						</Link>
					</motion.div>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{/* Card 1: Your Tasks */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.3 }}
						className="group relative flex min-h-[400px] flex-col justify-between overflow-hidden rounded-md border border-white/5 bg-surface p-8 transition-colors hover:border-white/10"
					>
						<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

						<div className="relative z-10">
							<div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md border border-white/5 bg-white/5 text-white">
								<SparklesIcon size={20} />
							</div>
							<h3 className="mb-2 font-light text-2xl text-white">
								Mimir Companion
							</h3>
							<p className="text-sm text-zinc-400 leading-relaxed">
								Automated suggestions and follow-ups. Mimir detects when tasks
								stall and prompts the right people.
							</p>
						</div>

						<div className="mt-auto rounded-xl border border-white/5 bg-black/20 p-5 backdrop-blur-md">
							<div className="mb-3 flex gap-3">
								<div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">
									<Sparkles size={12} className="text-white" />
								</div>
								<div className="text-xs text-zinc-300 italic">
									"Hey, the{" "}
									<span className="text-white not-italic">
										Q3 Design Review
									</span>{" "}
									is blocked. Want me to ping{" "}
									<span className="text-white not-italic">Sarah</span>?"
								</div>
							</div>
							<div className="flex gap-2 pl-9">
								<div className="cursor-pointer rounded border border-primary/30 bg-primary px-3 py-1.5 text-[10px] text-primary-foreground hover:bg-primary/90">
									Yes, send reminder
								</div>
								<div className="cursor-pointer rounded border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-zinc-400 hover:bg-white/10">
									Ignore
								</div>
							</div>
						</div>
					</motion.div>

					{/* Card 2: Mimrai Companion */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="group relative flex min-h-[400px] flex-col justify-between overflow-hidden rounded-md border border-white/10 p-8 transition-colors hover:border-white/20"
					>
						<div className="relative z-10">
							<div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
								<WindIcon size={20} />
							</div>
							<h3 className="mb-2 font-light text-2xl text-white">Zen Mode</h3>
							<p className="text-sm text-zinc-400 leading-relaxed">
								A calm environment that reduces noise. Mimir organizes your day
								automatically so you can focus on execution.
							</p>
						</div>

						<div className="relative mt-10">
							<div className="absolute inset-0 z-10 bg-gradient-to-t from-surface via-transparent to-transparent" />
							<div className="space-y-3 opacity-80">
								{/* Active Task */}
								<div className="flex items-center gap-4 rounded-lg border border-white/20 bg-white/5 p-4">
									<div className="h-5 w-5 cursor-pointer rounded-full border-2 border-white/20 transition-colors hover:border-white/50" />
									<div className="flex-1">
										<div className="mb-2 h-2 w-32 rounded-full bg-white/20" />
										<div className="h-1.5 w-16 rounded-full bg-white/10" />
									</div>
									<Badge
										variant="outline"
										className="border-green-500/20 bg-green-500/5 text-green-400"
									>
										Focus
									</Badge>
								</div>
								{/* Next Tasks (Blurred) */}
								<div className="flex items-center gap-4 rounded-lg border border-white/5 bg-transparent p-4 opacity-50 blur-[0.5px]">
									<div className="h-5 w-5 rounded-full border-2 border-white/10" />
									<div className="h-2 w-24 rounded-full bg-white/10" />
								</div>
								<div className="flex items-center gap-4 rounded-lg border border-white/5 bg-transparent p-4 opacity-30 blur-[1px]">
									<div className="h-5 w-5 rounded-full border-2 border-white/10" />
									<div className="h-2 w-28 rounded-full bg-white/10" />
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
};
