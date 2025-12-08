"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import type React from "react";

export const Showcase: React.FC = () => {
	return (
		<section className="relative overflow-hidden bg-black py-32">
			<div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="mb-12 font-light text-4xl text-white"
				>
					Total visibility. <br />
					<span className="text-zinc-500">Zero clutter.</span>
				</motion.h2>

				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					whileInView={{ opacity: 1, scale: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					className="relative mx-auto flex h-[500px] max-w-4xl flex-col overflow-hidden bg-surface"
				>
					<Image
						src={"/images/showcase2.png"}
						alt="Mimir AI Showcase"
						width={1366}
						height={768}
						className="object-cover"
					/>
				</motion.div>
			</div>
		</section>
	);
};
