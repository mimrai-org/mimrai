"use client";
import { cn } from "@ui/lib/utils";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
} from "lucide-react";

export const healthOptions = [
	{
		value: "on_track",
		label: "On Track",
		icon: CheckCircle2Icon,
		color: "text-green-500",
	},
	{
		value: "at_risk",
		label: "At Risk",
		icon: AlertTriangleIcon,
		color: "text-yellow-500",
	},
	{
		value: "off_track",
		label: "Off Track",
		icon: AlertCircleIcon,
		color: "text-red-500",
	},
] as const;

export const ProjectHealthIcon = ({
	health,
	className,
}: {
	health: string;
	className?: string;
}) => {
	const option = healthOptions.find((opt) => opt.value === health);
	if (!option) return null;
	const Icon = option.icon;
	return <Icon className={cn("size-6", option.color, className)} />;
};

export const ProjectHealthLabel = ({
	health,
	className,
}: {
	health: string;
	className?: string;
}) => {
	const option = healthOptions.find((opt) => opt.value === health);
	if (!option) return null;
	return <span className={cn(className, option.color)}>{option.label}</span>;
};
