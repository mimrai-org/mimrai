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
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { trpc } from "@/utils/trpc";

const chartConfig = {
	taskCount: {
		label: "Tasks",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export const TasksByStatusWidget = () => {
	const [dateRange, setDateRange] = useState<{
		startDate: Date;
		endDate: Date;
	}>({
		startDate: sub(new Date(), { days: 7 }),
		endDate: new Date(),
	});

	const { data } = useQuery(
		trpc.widgets.tasksByStatus.queryOptions({
			...dateRange,
		}),
	);

	return (
		<Card className="flex flex-col justify-between">
			<CardHeader>
				<CardDescription>
					Determine the distribution of tasks across different statuses
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart
						accessibilityLayer
						data={data || []}
						layout="horizontal"
						margin={{ bottom: 5 }}
					>
						<YAxis type="number" dataKey={"taskCount"} hide />
						<XAxis
							type="category"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							dataKey="status.name"
							tickFormatter={(value) =>
								(value as string)
									.split(" ")
									.map((word) => word.slice(0, 4))
									.join(" ")
							}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Bar dataKey={"taskCount"} fill="var(--chart-2)" />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
