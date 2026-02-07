import { cn } from "@ui/lib/utils";

export const NavItem = ({
	children,
	className,
	onClick,
}: {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
}) => {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full items-center gap-2 rounded-sm px-4 py-2 text-left text-sm hover:bg-accent dark:hover:bg-accent/30",
				className,
			)}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

export const NavItemContent = ({ children }: { children: React.ReactNode }) => {
	return <div className="flex w-full flex-col overflow-hidden">{children}</div>;
};

export const NavItemTitle = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<span className={cn("truncate font-medium", className)}>{children}</span>
	);
};

export const NavItemSubtitle = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return (
		<span className="flex items-center gap-2 truncate text-muted-foreground text-xs">
			{children}
		</span>
	);
};

export const NavItemIcon = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="relative [&>svg]:size-10 [&>svg]:stroke-1 [&>svg]:opacity-80">
			{children}
		</div>
	);
};

export const NavItemIconSecondary = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<div
			className={cn(
				"absolute right-0 bottom-0 size-4 rounded-sm bg-background [&>svg]:size-4 [&>svg]:text-muted-foreground",
				className,
			)}
		>
			{children}
		</div>
	);
};

export const NavItemIndicator = ({
	children,
	show,
	className,
}: {
	children: React.ReactNode;
	show?: boolean;
	className?: string;
}) => {
	if (show === false) {
		return null;
	}

	return (
		<div
			className={cn(
				"absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-background font-mono text-red-400 text-xs",
				className,
			)}
		>
			{children}
		</div>
	);
};
