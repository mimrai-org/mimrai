import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const loadingMessages = [
	"Focusing your mind...",
	"Eliminating distractions...",
	"Preparing your workspace...",
	"Aligning your thoughts...",
	"Setting the mood for productivity...",
];

export const ZenModeLoading = () => {
	const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setCurrentMessageIndex(
				(prevIndex) => (prevIndex + 1) % loadingMessages.length,
			);
		}, 3000); // Change message every 3 seconds

		return () => clearInterval(intervalRef.current!);
	}, []);

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="sr-only">Loading Zen Mode...</div>

			<div className="flex flex-col items-center gap-4">
				<AnimatePresence mode="wait">
					{loadingMessages.map((message, index) => {
						if (index !== currentMessageIndex) return null;
						return (
							<motion.div
								className="font-medium text-muted-foreground text-xl"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
								key={index}
							>
								{message}
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
};
