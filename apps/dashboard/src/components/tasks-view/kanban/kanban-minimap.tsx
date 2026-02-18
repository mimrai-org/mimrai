"use client";

import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { cn } from "@/lib/utils";

interface KanbanMinimapProps {
	scrollContainerRef: RefObject<HTMLDivElement | null>;
	columnsCount: number;
}

export function KanbanMinimap({
	scrollContainerRef,
	columnsCount,
}: KanbanMinimapProps) {
	const minimapRef = useRef<HTMLDivElement>(null);
	const [viewportRect, setViewportRect] = useState({
		left: 0,
		width: 100,
	});
	const [isDragging, setIsDragging] = useState(false);
	const [isVisible, setIsVisible] = useState(false);

	// Calculate viewport position based on scroll
	const updateViewport = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const { scrollLeft, scrollWidth, clientWidth } = container;

		// Only show minimap if content overflows
		setIsVisible(scrollWidth > clientWidth);

		if (scrollWidth <= clientWidth) return;

		const viewportWidthPercent = (clientWidth / scrollWidth) * 100;
		const viewportLeftPercent = (scrollLeft / scrollWidth) * 100;

		setViewportRect({
			left: viewportLeftPercent,
			width: viewportWidthPercent,
		});
	}, [scrollContainerRef]);

	// Scroll to position based on minimap click/drag
	const scrollToPosition = useCallback(
		(clientX: number) => {
			const minimap = minimapRef.current;
			const container = scrollContainerRef.current;
			if (!minimap || !container) return;

			const minimapRect = minimap.getBoundingClientRect();
			const clickPositionPercent =
				(clientX - minimapRect.left) / minimapRect.width;

			// Center the viewport on the click position
			const { scrollWidth, clientWidth } = container;
			const maxScroll = scrollWidth - clientWidth;
			const targetScroll = clickPositionPercent * scrollWidth - clientWidth / 2;

			container.scrollTo({
				left: Math.max(0, Math.min(maxScroll, targetScroll)),
				behavior: isDragging ? "auto" : "smooth",
			});
		},
		[scrollContainerRef, isDragging],
	);

	// Handle click on minimap
	const handleMinimapClick = (e: React.MouseEvent) => {
		scrollToPosition(e.clientX);
	};

	// Handle drag start
	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);
		scrollToPosition(e.clientX);
	};

	// Handle drag move and end
	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			scrollToPosition(e.clientX);
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, scrollToPosition]);

	// Listen to scroll events
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		updateViewport();

		container.addEventListener("scroll", updateViewport);
		window.addEventListener("resize", updateViewport);

		// Use ResizeObserver to detect content size changes
		const resizeObserver = new ResizeObserver(updateViewport);
		resizeObserver.observe(container);

		return () => {
			container.removeEventListener("scroll", updateViewport);
			window.removeEventListener("resize", updateViewport);
			resizeObserver.disconnect();
		};
	}, [scrollContainerRef, updateViewport]);

	if (!isVisible || columnsCount === 0) return null;

	return (
		<div className="fixed right-4 bottom-4 z-10">
			<div
				ref={minimapRef}
				className={cn(
					"relative h-12 w-40 cursor-pointer overflow-hidden rounded-lg border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm transition-all",
					isDragging && "ring-2 ring-primary/50",
				)}
				onClick={handleMinimapClick}
				onMouseDown={handleMouseDown}
			>
				{/* Column previews */}
				<div className="absolute inset-1 flex gap-0.5">
					{Array.from({ length: columnsCount }).map((_, i) => (
						<div key={i} className="h-full flex-1 rounded-sm bg-muted/50" />
					))}
				</div>

				{/* Viewport indicator */}
				<div
					className={cn(
						"absolute top-0 bottom-0 rounded-sm border-2 border-primary bg-primary/20 transition-colors",
						isDragging && "bg-primary/30",
					)}
					style={{
						left: `${viewportRect.left}%`,
						width: `${viewportRect.width}%`,
					}}
				/>
			</div>
		</div>
	);
}
