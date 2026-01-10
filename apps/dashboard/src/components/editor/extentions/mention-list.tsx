import type { RouterOutputs } from "@mimir/trpc";
import type { SuggestionProps } from "@tiptap/suggestion";
import { useEffect, useImperativeHandle, useMemo, useState } from "react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { cn } from "@/lib/utils";

type Member = RouterOutputs["teams"]["getMembers"][0];

export const MentionList = (props: SuggestionProps<Member>) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const items = useMemo(() => {
		return props.items;
	}, [props.items]);

	const handleSelect = (index: number) => {
		const item = items[index];
		if (item) {
			props.command({
				id: item.id,
				label: item.name,
			});
		}
	};

	const upHandler = () => {
		setSelectedIndex((selectedIndex + items.length - 1) % items.length);
	};

	const downHandler = () => {
		setSelectedIndex((selectedIndex + 1) % items.length);
	};

	const enterHandler = () => {
		handleSelect(selectedIndex);
	};

	useEffect(() => setSelectedIndex(0), [items]);

	// @ts-expect-error
	useImperativeHandle(props.ref, () => ({
		// @ts-expect-error
		onKeyDown: ({ event }) => {
			if (event.key === "ArrowUp") {
				upHandler();
				return true;
			}

			if (event.key === "ArrowDown") {
				downHandler();
				return true;
			}

			if (event.key === "Enter") {
				enterHandler();
				return true;
			}

			if (event.key === "Tab") {
				event.preventDefault();
				event.stopPropagation();
				enterHandler();
				return true;
			}

			return false;
		},
	}));

	return (
		<div className="relative overflow-auto rounded-md border bg-popover shadow-md">
			{items.length === 0 ? (
				<div className="px-4 py-2 text-muted-foreground text-sm">
					No members found
				</div>
			) : (
				<div className="w-full">
					{items.map((item, index) => (
						<button
							key={item.id}
							type="button"
							className={cn(
								"flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm",
								{
									"bg-accent text-accent-foreground": selectedIndex === index,
								},
							)}
							onMouseEnter={() => setSelectedIndex(index)}
							onClick={() => handleSelect(index)}
						>
							<AssigneeAvatar {...item} className="size-5" />
							{item.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
};
