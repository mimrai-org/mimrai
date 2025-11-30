import { cn } from "@ui/lib/utils";
import { BoxIcon, LayersIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ContextItem, useChatContext } from "./store";

type ContextType = ContextItem["type"];
const ContextIcons: Record<
	ContextType,
	React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
	task: LayersIcon,
	project: BoxIcon,
};

export const ChatContextList = ({
	disabled,
	className,
	items,
}: {
	disabled?: boolean;
	className?: string;
	items: ContextItem[];
}) => {
	if (items.length === 0) {
		return null;
	}

	return (
		<AnimatePresence mode="wait">
			<ul
				className={cn(
					"scrollbar-hide flex gap-2 overflow-x-auto px-2 text-xs",
					className,
				)}
			>
				{items.map((item) => {
					return (
						<ChatContextItem key={item.key} item={item} disabled={disabled} />
					);
				})}
			</ul>
		</AnimatePresence>
	);
};

export const ChatContextItem = ({
	item,
	disabled,
}: {
	item: ContextItem;
	disabled?: boolean;
}) => {
	const { removeItem } = useChatContext();
	const Icon = ContextIcons[item.type];
	return (
		<motion.li
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			className="flex w-fit flex-nowrap divide-x rounded-sm border bg-secondary py-1"
		>
			<button
				type="button"
				onClick={() => {
					removeItem(item.key);
				}}
				className={cn("group relative size-3.5 cursor-pointer px-3", {
					"cursor-default": disabled,
				})}
				disabled={disabled}
			>
				<Icon
					className={cn(
						"-translate-x-1/2 absolute inset-y-0 left-1/2 size-3.5 transition-opacity",
						{
							"group-hover:opacity-0": !disabled,
						},
					)}
				/>
				{!disabled && (
					<XIcon className="-translate-x-1/2 absolute inset-y-0 left-1/2 size-3.5 text-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
				)}
			</button>
			<span className="whitespace-nowrap px-2">{item.label}</span>
		</motion.li>
	);
};
