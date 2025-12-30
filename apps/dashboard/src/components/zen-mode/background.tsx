"use client";
import { motion } from "motion/react";

const backgroundVariants = {};

export const ZenModeBackground = () => {
	return (
		<motion.div
			initial={{ scale: 1.5 }}
			animate={{ scale: 1 }}
			transition={{
				duration: 30,
				repeat: Number.POSITIVE_INFINITY,
				repeatType: "reverse",
				ease: "linear",
			}}
			className="pointer-events-none fixed inset-0 aspect-square bg-radial-[50%_50%] from-blue-200/2 to-transparent"
		/>
	);
};
