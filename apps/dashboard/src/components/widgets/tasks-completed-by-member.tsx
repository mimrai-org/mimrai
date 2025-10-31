"use client";
import { Card, CardContent, CardDescription, CardHeader } from "@mimir/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@mimir/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@ui/components/ui/skeleton";
import { sub } from "date-fns";
import { useMemo, useState } from "react";
import { Pie, PieChart } from "recharts";
import { trpc } from "@/utils/trpc";

const colors = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export const TasksCompletedByMember = () => {
	const [dateRange, setDateRange] = useState<{
		startDate: Date;
		endDate: Date;
	}>({
		startDate: sub(new Date(), { days: 7 }),
		endDate: new Date(),
	});

	const { data: completedData } = useQuery(
		trpc.widgets.tasksCompletedByMember.queryOptions(
			{
				...dateRange,
			},
			{
				select: (data) =>
					data.map((item, index) => ({
						...item,
						fill:
							item.member.color ||
							"var(--muted-foreground)" ||
							colors[index % colors.length],
					})),
			},
		),
	);

	const { data: assignedData } = useQuery(
		trpc.widgets.tasksAssignedByMember.queryOptions(
			{
				...dateRange,
			},
			{
				select: (data) =>
					data.map((item, index) => ({
						...item,
						fill:
							item.member.color ||
							"var(--muted-foreground)" ||
							colors[index % colors.length],
					})),
			},
		),
	);

	console.log({ completedData, assignedData });

	return (
		<Card>
			<CardHeader>
				<CardDescription>
					Tasks completed by each member over the last week.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={{}} className="mx-auto aspect-square h-48">
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Pie
							data={completedData}
							dataKey="completedCount"
							nameKey="member.name"
							innerRadius={60}
							outerRadius={80}
						/>
						<Pie
							data={assignedData}
							dataKey="assignedCount"
							nameKey="member.name"
							outerRadius={50}
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
