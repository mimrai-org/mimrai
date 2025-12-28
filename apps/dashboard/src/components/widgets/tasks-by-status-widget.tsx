"use client";
import { Card, CardContent, CardDescription, CardHeader } from "@mimir/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/ui/chart";
import { sub } from "date-fns";
import { useMemo, useState } from "react";
import { Pie, PieChart } from "recharts";
import { trpc } from "@/utils/trpc";

const chartConfig = {
	taskCount: {
		label: "Tasks",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

const statusColors: Record<string, string> = {
	in_progress: "var(--color-yellow-400)",
	done: "var(--color-green-400)",
};

export const TasksByStatusWidget = () => {
	const [dateRange, setDateRange] = useState<{
		startDate: Date;
		endDate: Date;
	}>({
		startDate: sub(new Date(), { days: 7 }),
		endDate: new Date(),
	});

	const { data } = useQuery(
		trpc.widgets.tasksByStatus.queryOptions(
			{
				...dateRange,
			},
			{
				select: (data) =>
					data.map((item) => ({
						...item,
						fill: statusColors[item.status.type] || "var(--color-chart-2)",
						label: item.status.name,
					})),
			},
		),
	);

	const chartConfig = useMemo<ChartConfig>(() => {
		const config: ChartConfig = {};
		for (const item of data || []) {
			config[item.status.name] = {
				label: item.status.name,
				color: item.fill,
			};
		}
		return config;
	}, [data]);

	return (
		<Card>
			<CardHeader>
				<CardDescription>Tasks by Status</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[200px] [&_.recharts-text]:fill-background"
				>
					<PieChart>
						<ChartTooltip
							content={<ChartTooltipContent nameKey="label" hideLabel />}
						/>
						<Pie
							data={data}
							innerRadius={30}
							dataKey="taskCount"
							radius={10}
							cornerRadius={8}
							paddingAngle={4}
						>
							{/* <LabelList
								dataKey="status.name"
								stroke="none"
								fontSize={12}
								fontWeight={500}
								fill="currentColor"
								formatter={(value: number) => value.toString()}
							/> */}
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
