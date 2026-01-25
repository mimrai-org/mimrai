"use client";
import { XIcon } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { type PanelInstance, usePanels } from "./panel-context";

const PANEL_OFFSET = 8; // pixels offset per panel in the stack

interface PanelContainerProps {
	panel: PanelInstance;
	index: number;
	children: React.ReactNode;
	className?: string;
	showCloseButton?: boolean;
	onClose?: () => void;
}

export function PanelContainer({
	panel,
	index,
	children,
	className,
	showCloseButton = true,
	onClose,
}: PanelContainerProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const { closePanel, bringToFront, panels } = usePanels();

	const handleClose = useCallback(() => {
		closePanel(panel.type, panel.id);
		onClose?.();
	}, [closePanel, panel.type, panel.id, onClose]);

	const handlePanelClick = useCallback(() => {
		bringToFront(panel.type, panel.id);
	}, [bringToFront, panel.type, panel.id]);

	// Handle escape key to close the topmost panel (last in array)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (panels.length === 0) return;

				// The last panel in the array is the topmost
				const topPanel = panels[panels.length - 1];

				// Only close if this is the top panel
				if (topPanel.type === panel.type && topPanel.id === panel.id) {
					handleClose();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [panels, panel.type, panel.id, handleClose]);

	// Calculate offset based on index
	const offset = index * PANEL_OFFSET;
	const isTopPanel = index === panels.length - 1;

	const portalContent = (
		<motion.div
			ref={panelRef}
			role="dialog"
			aria-modal="false"
			data-panel-type={panel.type}
			data-panel-id={panel.id}
			initial={{ opacity: 0, y: 50 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 50 }}
			transition={{ duration: 0.2 }}
			style={{
				right: `calc(2rem + ${offset}px)`,
				zIndex: 40 + index,
			}}
			className={cn(
				"fixed bottom-0 left-auto h-[80vh] overflow-y-auto rounded-t-lg border-x border-t bg-background pt-0 shadow-lg shadow-secondary/20 sm:w-[700px]",
				className,
			)}
			onClick={handlePanelClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handlePanelClick();
				}
			}}
		>
			{showCloseButton && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleClose();
					}}
					className="absolute top-4 right-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					<XIcon className="size-4" />
					<span className="sr-only">Close</span>
				</button>
			)}
			{isTopPanel ? children : null}
		</motion.div>
	);

	if (typeof document !== "undefined") {
		return createPortal(portalContent, document.body);
	}

	return null;
}
