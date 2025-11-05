"use client";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { RotatingText } from "@ui/components/ui/rotating-text";
import {
	ChevronDownIcon,
	CirclePlusIcon,
	Layers3Icon,
	LayersIcon,
	PlusIcon,
} from "lucide-react";
import { useColumnParams } from "@/hooks/use-column-params";
import { useTaskParams } from "@/hooks/use-task-params";

export const CreateButton = () => {
	const { setParams: setTaskParams } = useTaskParams();
	const { setParams: setColumnParams } = useColumnParams();

	return (
		<div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button type="button" className="w-full justify-between">
						<div className="flex items-center gap-2">
							<PlusIcon />
							<RotatingText
								text={["Create Task", "Create Column"]}
								duration={4000}
								y={-20}
								transition={{ duration: 0.2, ease: "easeInOut" }}
							/>
						</div>
						<ChevronDownIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-[236px]">
					<DropdownMenuItem onClick={() => setTaskParams({ createTask: true })}>
						<Layers3Icon />
						Task
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setColumnParams({ createColumn: true })}
					>
						<CirclePlusIcon />
						Column
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
