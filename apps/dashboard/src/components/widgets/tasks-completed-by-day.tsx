"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@mimir/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { format, sub } from "date-fns";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { trpc } from "@/utils/trpc";

const chartConfig = {
	completedCount: {
		label: "Tasks Completed",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export const TasksCompletedByDay = () => {
	const [dateRange, setDateRange] = useState<{
		startDate: Date;
		endDate: Date;
	}>({
		startDate: sub(new Date(), { days: 7 }),
		endDate: new Date(),
	});

	const { data } = useQuery(
		trpc.widgets.tasksCompletedByDay.queryOptions({
			...dateRange,
		}),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tasks Completed By Day</CardTitle>
				<CardDescription>
					Number of tasks completed each day over the last week.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-48 w-full"
				>
					<LineChart
						accessibilityLayer
						data={data || []}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey={"date"}
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => format(value, "MM/dd")}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Line
							dataKey={"taskCompletedCount"}
							type={"monotone"}
							stroke="var(--chart-2)"
							strokeWidth={2}
							dot={false}
						/>
						<Line
							dataKey={"checklistItemsCompletedCount"}
							type={"monotone"}
							stroke="var(--chart-1)"
							strokeDasharray={5}
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
