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
import { useProjectParams } from "@/hooks/use-project-params";
import { useStatusParams } from "@/hooks/use-status-params";
import { useTaskParams } from "@/hooks/use-task-params";

export const CreateButton = () => {
	const { setParams: setTaskParams } = useTaskParams();
	const { setParams: setStatusParams } = useStatusParams();
	const { setParams: setProjectParams } = useProjectParams();

	return (
		<div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						className="w-full justify-between overflow-hidden group-data-[collapsible=icon]:h-7! group-data-[collapsible=icon]:p-2.5!"
					>
						<div className="flex items-center gap-2">
							<PlusIcon />
							<RotatingText
								text={["Create Task", "Create Status", "Create Project"]}
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
						onClick={() => setStatusParams({ createStatus: true })}
					>
						<CirclePlusIcon />
						Status
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
