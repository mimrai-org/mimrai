import type { RouterOutputs } from "@mimir/trpc";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import { useZenMode } from "../use-zen-mode";

export type Activity = NonNullable<
	RouterOutputs["activities"]["get"]["data"][number]
>;

export type InlineComment = {
	id: string;
	comment: string;
	element: HTMLElement | null;
	activity: Activity;
	top: number;
	left: number;
};

export type StackedComment = InlineComment & {
	calculatedTop: number;
};

const COMMENT_GAP = 12; // Gap between stacked comments

export const useInlineComments = () => {
	const { currentTask, contentRef } = useZenMode();
	const [positions, setPositions] = useState<InlineComment[]>([]);
	const [stackedComments, setStackedComments] = useState<StackedComment[]>([]);
	const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const recalcTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const { data: comments } = useQuery(
		trpc.activities.get.queryOptions(
			{
				groupId: currentTask.id,
				type: ["task_comment"],
				nStatus: ["archived"],
				pageSize: 100,
			},
			{
				enabled: !!currentTask.id,
			},
		),
	);

	// Register a ref for an item
	const registerItemRef = useCallback(
		(id: string, element: HTMLDivElement | null) => {
			if (element) {
				itemRefs.current.set(id, element);
			} else {
				itemRefs.current.delete(id);
			}
		},
		[],
	);

	// Calculate stacked positions based on actual heights
	const calculateStackedPositions = useCallback(() => {
		if (positions.length === 0) {
			setStackedComments([]);
			return;
		}

		// Sort by original top position
		const sorted = [...positions].sort((a, b) => a.top - b.top);

		// Track occupied vertical ranges
		const occupiedRanges: { top: number; bottom: number }[] = [];

		const result: StackedComment[] = sorted.map((comment) => {
			const element = itemRefs.current.get(comment.id);
			const height = element?.offsetHeight || 80;

			// Find the first available position starting from the original top
			let calculatedTop = comment.top;

			// Check for overlaps and find next available position
			let hasOverlap = true;
			while (hasOverlap) {
				hasOverlap = false;
				for (const range of occupiedRanges) {
					// Check if current position overlaps with this range
					const wouldOverlap =
						calculatedTop < range.bottom + COMMENT_GAP &&
						calculatedTop + height > range.top - COMMENT_GAP;

					if (wouldOverlap) {
						// Move below this range
						calculatedTop = range.bottom + COMMENT_GAP;
						hasOverlap = true;
						break;
					}
				}
			}

			// Add this comment's range to occupied ranges
			occupiedRanges.push({
				top: calculatedTop,
				bottom: calculatedTop + height,
			});

			return {
				...comment,
				calculatedTop,
			};
		});

		setStackedComments(result);
	}, [positions]);

	// Trigger recalculation (debounced)
	const measureHeights = useCallback(() => {
		if (recalcTimeoutRef.current) {
			clearTimeout(recalcTimeoutRef.current);
		}
		recalcTimeoutRef.current = setTimeout(calculateStackedPositions, 50);
	}, [calculateStackedPositions]);

	// Calculate positions after render and on resize/scroll
	useEffect(() => {
		const calculatePositions = () => {
			if (!comments || !contentRef.current) {
				setPositions([]);
				return;
			}

			const contentElement = contentRef.current;
			const contentRect = contentElement.getBoundingClientRect();

			const newPositions: InlineComment[] = comments.data
				.map((comment) => {
					if (!comment.user) return null;
					const commentText = comment.metadata?.comment;
					if (!commentText) return null;

					// Find the element with data-id matching the comment id
					const commentElement = contentElement.querySelector(
						`[data-id="${comment.id}"]`,
					);
					if (!commentElement) return null;

					const rect = commentElement.getBoundingClientRect();

					// Calculate position relative to the content container
					const top = rect.top - contentRect.top;
					const left = rect.right - contentRect.left;

					return {
						id: comment.id,
						comment: commentText,
						element: commentElement as HTMLElement,
						activity: comment,
						top,
						left,
					} as InlineComment;
				})
				.filter((c): c is InlineComment => c !== null);

			setPositions(newPositions);
		};

		// Initial calculation with a small delay to ensure DOM is ready
		const timeoutId = setTimeout(calculatePositions, 100);

		// Recalculate on window resize
		window.addEventListener("resize", calculatePositions);

		// Use ResizeObserver to watch for content changes
		const resizeObserver = new ResizeObserver(calculatePositions);
		if (contentRef.current) {
			resizeObserver.observe(contentRef.current);
		}

		// Use MutationObserver to watch for DOM changes (editor content updates)
		const mutationObserver = new MutationObserver(calculatePositions);
		if (contentRef.current) {
			mutationObserver.observe(contentRef.current, {
				childList: true,
				subtree: true,
			});
		}

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("resize", calculatePositions);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, [comments, contentRef]);

	// Recalculate stacking after positions change
	useEffect(() => {
		// Delay to ensure items have rendered
		const timeoutId = setTimeout(calculateStackedPositions, 100);
		return () => clearTimeout(timeoutId);
	}, [positions, calculateStackedPositions]);

	return {
		stackedComments,
		currentTask,
		registerItemRef,
		measureHeights,
	};
};
