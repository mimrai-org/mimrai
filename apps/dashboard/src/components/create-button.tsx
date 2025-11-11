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
	BoxIcon,
	ChevronDownIcon,
	CirclePlusIcon,
	Layers3Icon,
	PlusIcon,
} from "lucide-react";
import { useColumnParams } from "@/hooks/use-column-params";
import { useProjectParams } from "@/hooks/use-project-params";
import { useTaskParams } from "@/hooks/use-task-params";

export const CreateButton = () => {
	const { setParams: setTaskParams } = useTaskParams();
	const { setParams: setColumnParams } = useColumnParams();
	const { setParams: setProjectParams } = useProjectParams();

	return (
		<div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						className="w-full justify-between group-data-[collapsible=icon]:h-7! group-data-[collapsible=icon]:p-2!"
					>
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
					<DropdownMenuItem
						onClick={() => setProjectParams({ createProject: true })}
					>
						<BoxIcon />
						Project
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
