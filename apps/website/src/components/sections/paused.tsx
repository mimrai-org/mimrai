"use client";

import { getAppUrl } from "@mimir/utils/envs";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import { ArrowRight, ChevronRight, Github, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { AbstractSphere, ParticleNetwork } from "../visuals/background-effects";

export const Paused: React.FC = () => {
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
					Paused for now <br />
					<span className="text-zinc-400">but we're not gone.</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
					className="mb-10 max-w-2xl font-light text-lg text-zinc-400 leading-relaxed md:text-xl"
				>
					We're taking a pause to focus on building the best possible product.
					We're not gone, and we'll be back with something amazing. Stay tuned!
				</motion.p>
			</div>
		</section>
	);
};
