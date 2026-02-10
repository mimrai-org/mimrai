"use client";
import { Button } from "@ui/components/ui/button";
import { GithubIcon } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";

export const OpenSource: React.FC = () => {
	return (
		<section className="border-white/5 border-t bg-background py-24">
			<div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
				<div>
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1 font-medium text-xs text-zinc-400"
					>
						<GithubIcon size={12} />
						<span>AGPL-3.0 License</span>
					</motion.div>

					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.1 }}
						className="mb-6 font-light text-3xl text-white md:text-4xl"
					>
						Shape the future of <br />
						productivity.
					</motion.h2>

					<motion.p
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.2 }}
						className="mb-8 text-lg text-zinc-400 leading-relaxed"
					>
						Mimrai is early, open source, and building in public. We believe the
						best tools are built with their users, not just for them.
						<br />
						<br />
						This is a big opportunity to be among the first. Your opinion
						matters. Join us early to request features, report bugs, and
						directly influence our roadmap.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.3 }}
						className="flex flex-wrap gap-4"
					>
						<Button
							variant="default"
							onClick={() =>
								window.open("https://github.com/mimrai-org/mimrai", "_blank")
							}
						>
							<GithubIcon size={16} />
							Star on GitHub
						</Button>
					</motion.div>
				</div>

				{/* Visual for code/contribution */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					whileInView={{ opacity: 1, scale: 1 }}
					viewport={{ once: true }}
					transition={{ delay: 0.4 }}
					className="relative rounded-md border border-white/10 bg-surface p-6"
				>
					<div className="mb-4 flex items-center gap-2 border-white/5 border-b pb-4">
						<div className="h-2 w-2 bg-zinc-600" />
						<span className="font-mono text-xs text-zinc-500">
							CONTRIBUTING.md
						</span>
					</div>
					<div className="space-y-2 font-mono text-xs text-zinc-400">
						<p>
							<span className="text-blue-400"># How to contribute</span>
						</p>
						<p>We welcome contributions from the community!</p>
						<p className="opacity-50">...</p>
						<p>
							<span className="text-purple-400">-</span> Fork the repository
						</p>
						<p>
							<span className="text-purple-400">-</span> Create your feature
							branch
						</p>
						<p>
							<span className="text-purple-400">-</span> Open a Pull Request
						</p>
						<br />
						<p>
							<span className="text-green-400">+</span> Your code impacts
							thousands of teams.
						</p>
					</div>
				</motion.div>
			</div>
		</section>
	);
};
