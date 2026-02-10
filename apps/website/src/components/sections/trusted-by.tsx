"use client";
import { motion } from "motion/react";
import Image from "next/image";
import type React from "react";

const LogoPlaceholder = ({
	name,
	onlyLogo,
	logoClassName,
	logoSrc,
}: {
	name: string;
	onlyLogo?: boolean;
	logoClassName?: string;
	logoSrc?: string;
}) => (
	<div className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-white/5 px-4 opacity-40 grayscale transition-opacity hover:opacity-80">
		{logoSrc && (
			<Image
				src={logoSrc}
				alt={name}
				width={30}
				height={30}
				className={logoClassName}
			/>
		)}
		{onlyLogo ? null : (
			<span className="font-semibold text-sm uppercase tracking-widest">
				{name}
			</span>
		)}
	</div>
);

export const TrustedBy: React.FC = () => {
	return (
		<section className="relative z-10 border-white/5 border-b bg-background py-20">
			<div className="mx-auto max-w-7xl px-6 text-center">
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="mb-10 font-medium text-sm text-zinc-500 uppercase tracking-wider"
				>
					Trusted by forward-thinking teams
				</motion.p>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="flex flex-wrap justify-center gap-6 md:gap-8"
				>
					<LogoPlaceholder
						name="VLUE"
						logoSrc="/logos/vlue.png"
						logoClassName="invert"
					/>
					<LogoPlaceholder
						name="CONTAPP DIGITAL"
						logoSrc="/logos/contapp.png"
					/>
					<LogoPlaceholder name="Pryls Group & Asocs" />
				</motion.div>
			</div>
		</section>
	);
};
