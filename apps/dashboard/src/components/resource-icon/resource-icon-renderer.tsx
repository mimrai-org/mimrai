"use client";

import { cn } from "@ui/lib/utils";
import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import { getIconEntry } from "@/utils/resource-icons";

export type ResourceIconRendererProps = {
	/** The icon key stored in the database */
	iconKey: string | null | undefined;
	/** Fallback icon when no key is set or key is not found */
	fallback: ComponentType<{ className?: string }>;
	/** Additional class names applied to the wrapper */
	className?: string;
	/** Size class for the icon (defaults to "size-4") */
	size?: string;
};

/**
 * Renders a resource icon from the icon registry.
 *
 * - **emoji**: renders the emoji text
 * - **image**: renders an `<img>` tag
 * - **component**: renders the React component
 * - **fallback**: renders the provided fallback component if the key is missing or unknown
 */
export function ResourceIconRenderer({
	iconKey,
	fallback: Fallback,
	className,
	size = "size-4",
}: ResourceIconRendererProps) {
	const entry = getIconEntry(iconKey);

	if (!entry) {
		return <Fallback className={cn(size, className)} />;
	}

	switch (entry.type) {
		case "emoji":
			return (
				<span
					className={cn(
						"inline-flex items-center justify-center leading-none",
						size,
						className,
					)}
					role="img"
					aria-label="icon"
				>
					{entry.value}
				</span>
			);
		case "image":
			return (
				<Image
					src={entry.value}
					alt="icon"
					width={32}
					height={32}
					className={cn("object-contain", size, className)}
				/>
			);
		case "component": {
			const Icon = entry.value as ComponentType<SVGProps<SVGSVGElement>>;
			return <Icon className={cn(size, className)} />;
		}
	}
}
