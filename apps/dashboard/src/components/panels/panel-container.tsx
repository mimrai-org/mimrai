"use client";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	Maximize2Icon,
	Minimize2Icon,
	MinusIcon,
	XIcon,
} from "lucide-react";
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
	const {
		closePanel,
		bringToFront,
		panels,
		setMinimized,
		minimized,
		closeAllPanels,
	} = usePanels();

	// Calculate offset based on index
	const offset = index * PANEL_OFFSET;
	const isTopPanel = index === panels.length - 1;

	const handleClose = useCallback(() => {
		closePanel(panel.type, panel.id);
		onClose?.();
	}, [closePanel, panel.type, panel.id, onClose]);

	const handlePanelClick = useCallback(() => {
		if (minimized) {
			setMinimized(false);
			return;
		}
		if (isTopPanel) return;
		bringToFront(panel.type, panel.id);
	}, [bringToFront, panel.type, panel.id, isTopPanel, minimized, setMinimized]);

	// Handle escape key to minimize or close panels
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (panels.length === 0) return;

				// Only handle escape for the top panel to avoid multiple handlers
				const topPanel = panels[panels.length - 1];
				if (topPanel.type === panel.type && topPanel.id === panel.id) {
					closePanel(panel.type, panel.id);
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [panels, panel.type, panel.id, closePanel]);

	const portalContent = (
		<motion.div
			ref={panelRef}
			role="dialog"
			aria-modal="false"
			data-panel-type={panel.type}
			data-panel-id={panel.id}
			initial={{
				opacity: 0,
				y: minimized ? "88%" : 0,
				height: `calc(80vh - ${offset}px)`,
			}}
			animate={{
				opacity: 1,
				y: minimized ? "90%" : 0,
				height: `calc(80vh - ${offset}px)`,
			}}
			exit={{ opacity: 0, y: "100%" }}
			whileHover={
				!minimized
					? {
							y: isTopPanel ? 0 : -10,
						}
					: undefined
			}
			transition={{ duration: 0.15, ease: "easeInOut" }}
			style={{
				right: `calc(2rem + ${offset}px)`,
				zIndex: 45 + index,
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
			<div className="relative">
				{showCloseButton && (
					<div className="absolute top-4 right-4 z-10 flex items-center gap-4">
						{minimized ? (
							<button
								type="button"
								className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								onClick={() => setMinimized(false)}
							>
								<ArrowUpIcon className="size-3.5" />
								<span className="sr-only">Maximize</span>
							</button>
						) : (
							<button
								type="button"
								className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								onClick={(e) => {
									e.stopPropagation();
									setMinimized(true);
								}}
							>
								<ArrowDownIcon className="size-3.5" />
								<span className="sr-only">Minimize</span>
							</button>
						)}
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
									<span className="sr-only">Open</span>
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
			</div>
		</motion.div>
	);

	if (typeof document !== "undefined") {
		return createPortal(portalContent, document.body);
	}

	return null;
}
