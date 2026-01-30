"use client";
import { Maximize2Icon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
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
	maximizeLink?: string;
	onClose?: () => void;
}

export function PanelContainer({
	panel,
	index,
	children,
	className,
	showCloseButton = true,
	maximizeLink,
	onClose,
}: PanelContainerProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const { closePanel, bringToFront, panels } = usePanels();

	// Calculate offset based on index
	const offset = index * PANEL_OFFSET;
	const isTopPanel = index === panels.length - 1;

	const handleClose = useCallback(() => {
		closePanel(panel.type, panel.id);
		onClose?.();
	}, [closePanel, panel.type, panel.id, onClose]);

	const handlePanelClick = useCallback(() => {
		if (isTopPanel) return;
		bringToFront(panel.type, panel.id);
	}, [bringToFront, panel.type, panel.id, isTopPanel]);

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
			whileHover={{
				y: isTopPanel ? 0 : -5,
			}}
			transition={{ duration: 0.15, ease: "easeInOut" }}
			style={{
				right: `calc(2rem + ${offset}px)`,
				zIndex: 45 + index,
				height: `calc(80vh - ${offset}px)`,
			}}
			className={cn(
				"fixed bottom-0 left-auto overflow-y-auto rounded-t-lg border-x border-t bg-background pt-0 shadow-lg shadow-secondary/20 sm:w-[700px]",
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
				<div className="absolute top-4 right-4 z-10 flex items-center gap-4">
					{maximizeLink && (
						<Link
							href={maximizeLink}
							onClick={() => {
								handleClose();
							}}
						>
							<button
								type="button"
								className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							>
								<Maximize2Icon className="size-3.5" />
								<span className="sr-only">Maximize</span>
							</button>
						</Link>
					)}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							handleClose();
						}}
						className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>
						<XIcon className="size-4" />
						<span className="sr-only">Close</span>
					</button>
				</div>
			)}
			{isTopPanel ? children : null}
		</motion.div>
	);

	if (typeof document !== "undefined") {
		return createPortal(portalContent, document.body);
	}

	return null;
}
