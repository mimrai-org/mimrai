"use client";
import { cn } from "@ui/lib/utils";
import { SidebarCloseIcon, SidebarOpenIcon } from "lucide-react";
import { motion } from "motion/react";
import { createContext, useContext, useState } from "react";

interface StickySidebarContextValues {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const StickySidebarContext = createContext<
	StickySidebarContextValues | undefined
>(undefined);
export const useStickySidebar = () => {
	const context = useContext(StickySidebarContext);
	if (!context) {
		throw new Error(
			"useStickySidebar must be used within a StickySidebarProvider",
		);
	}
	return context;
};

export const STICKY_SIDEBAR_COOKIE = "sticky-sidebar-open" as const;
export const STICKY_SIDEBAR_WIDTH = 350;
export const STICKY_SIDEBAR_MIN_WIDTH = 0;

export const StickySidebarProvider = ({
	children,
	defaultOpen = true,
}: {
	children: React.ReactNode;
	defaultOpen?: boolean;
}) => {
	const [open, setOpen] = useState(defaultOpen);

	const onOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		// biome-ignore lint/suspicious/noDocumentCookie: is just sidebar open state
		document.cookie = `${STICKY_SIDEBAR_COOKIE}=${newOpen}; path=/; max-age=31536000`;
	};

	return (
		<StickySidebarContext.Provider
			value={{
				open: open,
				onOpenChange,
			}}
		>
			{children}
		</StickySidebarContext.Provider>
	);
};

const containerVariants = {
	open: {
		gridTemplateColumns: `${STICKY_SIDEBAR_WIDTH}px 1fr`,
		gap: "1.5rem",
	},
	closed: {
		gridTemplateColumns: `${STICKY_SIDEBAR_MIN_WIDTH}px 1fr`,
		gap: 0,
	},
};

export const StickySidebarContainer = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	const { open } = useStickySidebar();

	const state = open ? "open" : "closed";

	return (
		<motion.div
			className={cn("grid", className)}
			variants={containerVariants}
			initial={state}
			animate={state}
		>
			{children}
		</motion.div>
	);
};

const sidebarVariants = {
	open: {
		opacity: 1,
	},
	closed: {
		opacity: 0,
	},
};

export const StickySidebar = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	const { open } = useStickySidebar();

	const state = open ? "open" : "closed";

	return (
		<motion.div
			className={cn(
				"sticky top-12 flex h-[calc(100vh-100px)] flex-col overflow-y-auto overflow-x-hidden rounded-md border bg-card p-6 dark:border-none",
				className,
				{
					"pointer-events-none": !open,
				},
			)}
			variants={sidebarVariants}
			initial={state}
			animate={state}
		>
			{children}
		</motion.div>
	);
};

export const StickySidebarClose = ({
	children,
	className,
}: {
	children?: React.ReactNode;
	className?: string;
}) => {
	const { onOpenChange, open } = useStickySidebar();

	return (
		<button
			type="button"
			aria-label="Close sidebar"
			className={cn(
				"flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground",
				className,
			)}
			onClick={() => onOpenChange(!open)}
		>
			{open ? (
				<SidebarCloseIcon className="size-4" />
			) : (
				<SidebarOpenIcon className="size-4" />
			)}
		</button>
	);
};
