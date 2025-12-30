"use client";

import { TextShimmer } from "@mimir/ui/text-shimmer";
import { AnimatePresence, motion } from "motion/react";

interface AnimatedStatusProps {
	text: string | null;
	shimmerDuration?: number;
	className?: string;
	fadeDuration?: number;
	/** Animation variant for status changes */
	variant?: "fade" | "slide" | "scale" | "blur-fade";
}

export function AnimatedStatus({
	text,
	shimmerDuration = 1,
	className,
	fadeDuration = 0.2,
	variant = "fade",
}: AnimatedStatusProps) {
	// Animation variants for different effects
	const animations = {
		fade: {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			exit: { opacity: 0 },
		},
		slide: {
			initial: { opacity: 0, x: 10 },
			animate: { opacity: 1, x: 0 },
			exit: { opacity: 0, x: -10 },
		},
		scale: {
			initial: { opacity: 0, scale: 0.95 },
			animate: { opacity: 1, scale: 1 },
			exit: { opacity: 0, scale: 0.95 },
		},
		"blur-fade": {
			initial: { opacity: 0, filter: "blur(4px)" },
			animate: { opacity: 1, filter: "blur(0px)" },
			exit: { opacity: 0, filter: "blur(4px)" },
		},
	};

	const selectedAnimation = animations[variant];

	return (
		<div className="relative flex h-8 items-center whitespace-nowrap">
			<AnimatePresence mode="wait">
				{text && (
					<motion.div
						key={text} // Re-mount when text changes to trigger animation
						initial={selectedAnimation.initial}
						animate={selectedAnimation.animate}
						exit={selectedAnimation.exit}
						transition={{
							duration: fadeDuration,
							ease: "easeInOut",
						}}
						className="flex items-center gap-1.5 text-muted-foreground dark:text-[#666666]"
					>
						<TextShimmer className={className} duration={shimmerDuration}>
							{text || ""}
						</TextShimmer>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
