import { Avatar, AvatarFallback, AvatarImage } from "@mimir/ui/avatar";
import type { UIMessage } from "ai";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
	from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
	<div
		className={cn(
			"group flex w-full items-end justify-end gap-2",
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
					"max-w-[80%] py-3",
					"group-[.is-user]:border group-[.is-user]:bg-background group-[.is-user]:px-4 group-[.is-user]:text-foreground",
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
		className={cn(messageContentVariants({ variant, className }))}
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
	console.log("Avatar render", { src, name, className, props }),
	(
		<Avatar className={cn("size-7", className)} {...props}>
			<AvatarImage alt="" className="mt-0 mb-0" src={src} />
			<AvatarFallback>{name?.slice(0, 1) || "ME"}</AvatarFallback>
		</Avatar>
	)
);
