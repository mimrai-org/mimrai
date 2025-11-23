"use client";

import { Textarea } from "@ui/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { cn } from "@ui/lib/utils";
import type { FileUIPart } from "ai";
import { StarsIcon } from "lucide-react";
import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

export type PromptInputMessage = {
	text?: string;
	files?: FileUIPart[];
};

type PromptInputContextType = {
	isLoading: boolean;
	value: string;
	setValue: (value: string) => void;
	maxHeight: number | string;
	onSubmit?: () => void;
	disabled?: boolean;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
};

const PromptInputContext = createContext<PromptInputContextType>({
	isLoading: false,
	value: "",
	setValue: () => {},
	maxHeight: 240,
	onSubmit: undefined,
	disabled: false,
	textareaRef: React.createRef<HTMLTextAreaElement>(),
});

function usePromptInput() {
	const context = useContext(PromptInputContext);
	if (!context) {
		throw new Error("usePromptInput must be used within a PromptInput");
	}
	return context;
}

type PromptInputProps = {
	isLoading?: boolean;
	value?: string;
	onValueChange?: (value: string) => void;
	maxHeight?: number | string;
	onSubmit?: () => void;
	children: React.ReactNode;
	className?: string;
};

function PromptInput({
	className,
	isLoading = false,
	maxHeight = 240,
	value,
	onValueChange,
	onSubmit,
	children,
}: PromptInputProps) {
	const [internalValue, setInternalValue] = useState(value || "");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleChange = (newValue: string) => {
		setInternalValue(newValue);
		onValueChange?.(newValue);
	};

	return (
		<TooltipProvider>
			<PromptInputContext.Provider
				value={{
					isLoading,
					value: value ?? internalValue,
					setValue: onValueChange ?? handleChange,
					maxHeight,
					onSubmit,
					textareaRef,
				}}
			>
				<div
					className={cn(
						"cursor-text border bg-background p-2 shadow-xl",
						className,
					)}
					id="prompt-input"
					onClick={() => {
						textareaRef.current?.focus();
					}}
				>
					{children}
				</div>
			</PromptInputContext.Provider>
		</TooltipProvider>
	);
}

export type PromptInputTextareaProps = {
	disableAutosize?: boolean;
	placeholder?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Textarea>, "placeholder">;

function PromptInputTextarea({
	className,
	onKeyDown,
	disableAutosize = false,
	placeholder,
	...props
}: PromptInputTextareaProps) {
	const { value, setValue, maxHeight, onSubmit, disabled, textareaRef } =
		usePromptInput();

	useEffect(() => {
		if (disableAutosize) return;

		if (!textareaRef.current) return;
		textareaRef.current.style.height = "auto";
		textareaRef.current.style.height =
			typeof maxHeight === "number"
				? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
				: `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
	}, [value, maxHeight, disableAutosize]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSubmit?.();
		}
		onKeyDown?.(e);
	};

	return (
		<div className="relative">
			<Textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				className={cn(
					"min-h-[44px] w-full resize-none border-none bg-transparent text-primary shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent",
					className,
				)}
				rows={1}
				disabled={disabled}
				{...props}
			/>
			{placeholder && value.length === 0 && (
				<div className="pointer-events-none absolute top-2 left-3 text-muted-foreground text-sm">
					{placeholder}
				</div>
			)}
		</div>
	);
}

type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({
	children,
	className,
	...props
}: PromptInputActionsProps) {
	return (
		<div className={cn("flex items-center gap-2", className)} {...props}>
			{children}
		</div>
	);
}

type PromptInputActionProps = {
	className?: string;
	tooltip: React.ReactNode;
	children: React.ReactNode;
	side?: "top" | "bottom" | "left" | "right";
} & React.ComponentProps<typeof Tooltip>;

function PromptInputAction({
	tooltip,
	children,
	className,
	side = "top",
	...props
}: PromptInputActionProps) {
	const { disabled } = usePromptInput();

	return (
		<Tooltip {...props}>
			<TooltipTrigger
				asChild
				disabled={disabled}
				onClick={(event) => event.stopPropagation()}
			>
				{children}
			</TooltipTrigger>
			<TooltipContent side={side} className={className}>
				{tooltip}
			</TooltipContent>
		</Tooltip>
	);
}

export {
	PromptInput,
	PromptInputTextarea,
	PromptInputActions,
	PromptInputAction,
};
