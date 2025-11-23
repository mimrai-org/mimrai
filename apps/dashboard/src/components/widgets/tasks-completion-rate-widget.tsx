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
import { useState } from "react";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";
import { trpc } from "@/utils/trpc";

const chartConfig = {
	completedCount: {
		label: "Tasks",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export const TasksCompletionRate = () => {
	const [dateRange, setDateRange] = useState<{
		startDate: Date;
		endDate: Date;
	}>({
		startDate: sub(new Date(), { days: 7 }),
		endDate: new Date(),
	});

	const { data } = useQuery(
		trpc.widgets.tasksCompletionRate.queryOptions({
			...dateRange,
		}),
	);

	return (
		<Card className="flex flex-col justify-between">
			<CardHeader>
				<CardDescription>
					Tasks completion rate over the last week
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<LineChart accessibilityLayer data={data || []}>
						<YAxis type="number" dataKey={"completedCount"} hide />
						<XAxis
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							dataKey="date"
							tickFormatter={(value) =>
								new Date(value as string).toLocaleDateString("en-US", {
									day: "numeric",
									month: "short",
								})
							}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Line
							type="monotone"
							dataKey="completedCount"
							stroke="var(--chart-2)"
							strokeWidth={3}
							dot={{ r: 4, strokeWidth: 2, fill: "var(--chart-2)" }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
