import { type Avatar, AvatarFallback, AvatarImage } from "@mimir/ui/avatar";
import type { UIMessage } from "ai";
import { cva, type VariantProps } from "class-variance-authority";
import { Facehash } from "facehash";
import type { ComponentProps, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { AssigneeAvatar } from "../asignee-avatar";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
	from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
	<div
		className={cn(
			"group flex w-full items-start justify-end gap-2",
			from === "user" ? "is-user" : "is-assistant flex-row-reverse justify-end",
			className,
		)}
		{...props}
	/>
);

const messageContentVariants = cva(
	"is-user:dark flex flex-col gap-2 overflow-hidden rounded-sm text-sm",
	{
		variants: {
			variant: {
				contained: [
					"max-w-[80%] py-0",
					"group-[.is-user]:border-none group-[.is-user]:bg-transparent group-[.is-user]:px-4 group-[.is-user]:text-foreground",
					"group-[.is-assistant]:border-none group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-foreground",
				],
				flat: [
					"group-[.is-user]:max-w-[80%] group-[.is-user]:bg-background group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
					"group-[.is-assistant]:text-foreground",
				],
			},
		},
		defaultVariants: {
			variant: "contained",
		},
	},
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof messageContentVariants>;

export const MessageContent = ({
	children,
	className,
	variant,
	...props
}: MessageContentProps) => (
	<div
		className={cn(className, "mb-1 max-w-[80%] rounded-sm text-sm")}
		{...props}
	>
		{children}
	</div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
	src: string;
	name?: string;
};

export const MessageAvatar = ({
	src,
	name,
	className,
	...props
}: MessageAvatarProps) => (
	<AssigneeAvatar image={src} name={name} className={className} {...props} />
);
