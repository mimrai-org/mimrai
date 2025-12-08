"use client";
import { getAppUrl } from "@mimir/utils/envs";
import { Button } from "@ui/components/ui/button";
import { motion } from "framer-motion";
import { Bot, Layers, Zap } from "lucide-react";
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
						Built for Real-Time
						<br />
						Productivity Intelligence
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="mb-8 font-light text-xl text-zinc-400"
					>
						Automatic prioritization, task awareness, and instant team
						context—optimized for fast-moving teams who can't afford noise.
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
								<Layers size={20} />
							</div>
							<h3 className="mb-2 font-light text-2xl text-white">
								Unified Task Stream
							</h3>
							<p className="text-sm text-zinc-400 leading-relaxed">
								Your entire workflow in one clarity-focused view. Filter noise
								automatically.
							</p>
						</div>

						<div className="relative mt-10">
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className={`rounded-md border border-white/5 p-3 bg-white/${4 - i} flex transform items-center gap-3 backdrop-blur-sm transition-transform group-hover:translate-x-1`}
									>
										<div
											className={`h-2 w-2 ${i === 1 ? "bg-orange-400" : "bg-zinc-600"}`}
										/>
										<div className="h-2 w-24 bg-white/10" />
										<div className="ml-auto h-2 w-8 bg-white/5" />
									</div>
								))}
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
								<Bot size={20} />
							</div>
							<h3 className="mb-2 font-light text-2xl text-white">
								Mimrai Context Engine
							</h3>
							<p className="text-sm text-zinc-400 leading-relaxed">
								Understands your deadlines and team load. Suggests what to
								tackle next, not just what's due.
							</p>
						</div>

						<div className="relative mt-10 flex h-32 items-center justify-center">
							<Waveform className="opacity-60" />
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="flex items-center gap-2 rounded-md border border-white/10 bg-surface px-4 py-2 text-white text-xs">
									<Zap size={12} className="fill-yellow-400 text-yellow-400" />
									<span>Efficiency +24%</span>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
};
