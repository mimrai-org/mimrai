"use client";
import { motion } from "framer-motion";
import {
	Activity,
	Bell,
	BrainCircuit,
	CalendarClock,
	GitMerge,
	ListTodo,
	Maximize2,
	Moon,
	Sun,
	Users,
	Wind,
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
			icon: CalendarClock,
			title: "Project Management",
			description:
				"Manage milestones, deadlines, and timelines with clarity. Keep the big picture in view without losing the details.",
		},
		{
			icon: ListTodo,
			title: "Task Management",
			description:
				"Smart checklists, clear assignments, and due dates. Organize execution without the clutter of traditional tools.",
		},
		{
			icon: BrainCircuit,
			title: "Mimir AI Assistant",
			description:
				"Your smart companion. Automated follow-ups on stale tasks and proactive suggestions to unblock your team.",
		},
		{
			icon: Wind,
			title: "Zen Mode",
			description:
				"A calm environment that filters noise. Focus only on what's important right now, organized automatically by Mimir.",
		},
		{
			icon: Sun,
			title: "Smart Daily Digest",
			description:
				"Start your day with a curated focus order. Mimir analyzes dependencies to tell you exactly where to start.",
		},
		{
			icon: Moon,
			title: "End of Day Summary",
			description:
				"Close loops effortlessly. Get auto-generated reports on progress and blockers before you sign off.",
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
						A new category of tool.
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="text-zinc-400"
					>
						Designed to help you work better, not just organize more.
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
