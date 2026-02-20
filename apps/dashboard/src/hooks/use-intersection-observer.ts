"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
	threshold?: number;
	rootMargin?: string;
	enabled?: boolean;
}

export const useIntersectionObserver = <T extends HTMLElement = HTMLElement>({
	threshold = 0.1,
	rootMargin = "0px",
	enabled = true,
}: UseIntersectionObserverOptions = {}) => {
	const [isIntersecting, setIsIntersecting] = useState(false);
	const [hasIntersected, setHasIntersected] = useState(false);
	const ref = useRef<T>(null);

	useEffect(() => {
		let observer: IntersectionObserver;
		setTimeout(() => {
			if (!enabled || !ref.current) return;

			observer = new IntersectionObserver(
				([entry]) => {
					const isElementIntersecting = entry.isIntersecting;
					setIsIntersecting(isElementIntersecting);

					if (isElementIntersecting && !hasIntersected) {
						setHasIntersected(true);
					}
				},
				{
					threshold,
					rootMargin,
				},
			);

			observer.observe(ref.current);
		}, 300);

		return () => {
			if (observer) observer.disconnect();
		};
	}, [threshold, rootMargin, enabled, hasIntersected]);

	const reset = useCallback(() => {
		setHasIntersected(false);
		setIsIntersecting(false);
	}, []);

	return {
		ref,
		isIntersecting,
		hasIntersected,
		reset,
	};
};
