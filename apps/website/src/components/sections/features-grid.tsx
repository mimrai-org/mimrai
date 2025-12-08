"use client";
import { motion } from "framer-motion";
import {
	Activity,
	Bell,
	GitMerge,
	Maximize2,
	Moon,
	Sun,
	Users,
} from "lucide-react";
import type React from "react";

interface FeatureCardProps {
	icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
	title: string;
	description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
	icon: Icon,
	title,
	description,
}) => (
	<motion.div
		variants={{
			hidden: { opacity: 0, y: 20 },
			visible: { opacity: 1, y: 0 },
		}}
		className="group rounded-md border border-white/5 bg-surface p-6 transition-colors hover:border-white/10"
	>
		<div className="mb-4 flex h-10 w-10 items-center justify-center text-zinc-400 transition-colors group-hover:text-white">
			<Icon size={20} strokeWidth={1.5} />
		</div>
		<h4 className="mb-2 font-medium text-lg text-white">{title}</h4>
		<p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
	</motion.div>
);

export const FeaturesGrid: React.FC = () => {
	const features = [
		{
			icon: Sun,
			title: "Smart Daily Digest",
			description:
				"Start your day with an AI-curated list of what actually matters.",
		},
		{
			icon: Maximize2,
			title: "Zen Mode",
			description:
				"Minimize distractions with a focus-driven interface that adapts to your workflow.",
		},
		{
			icon: Moon,
			title: "End-of-Day Summary",
			description:
				"Auto-generated reports of what was accomplished and what's blocked.",
		},
		{
			icon: GitMerge,
			title: "Auto-Prioritization",
			description:
				"Dynamic sorting of tasks based on dependencies and deadlines.",
		},
		{
			icon: Users,
			title: "Team Awareness",
			description: "Know who is working on what without sending a single DM.",
		},
		{
			icon: Bell,
			title: "Context Notifications",
			description:
				"Alerts that understand context and only ping you when necessary.",
		},
	];

	return (
		<section id="features" className="relative bg-background py-24">
			<div className="mx-auto max-w-7xl px-6">
				<div className="mb-16 text-center">
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="mb-4 font-light text-3xl text-white"
					>
						Engineered for flow state
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="text-zinc-400"
					>
						Everything you need, nothing you don't.
					</motion.p>
				</div>
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-50px" }}
					variants={{
						hidden: { opacity: 0 },
						visible: {
							opacity: 1,
							transition: {
								staggerChildren: 0.1,
							},
						},
					}}
					className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
				>
					{features.map((f, i) => (
						<FeatureCard key={i} {...f} />
					))}
				</motion.div>
			</div>
		</section>
	);
};
