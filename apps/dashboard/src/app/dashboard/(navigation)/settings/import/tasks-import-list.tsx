"use client";
import { getApiUrl } from "@mimir/utils/envs";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

export const TasksImportList = () => {
	const [loading, setLoading] = useState(false);
	const [autoRefresh, setAutoRefresh] = useState(false);

	const { data: imports } = useQuery(
		trpc.imports.get.queryOptions(
			{},
			{
				refetchInterval: autoRefresh ? 3000 : false,
			},
		),
	);

	const shouldAutoRefresh = useMemo(() => {
		if (!imports?.data) return false;
		return imports.data.some(
			(imp) => imp.status === "processing" || imp.status === "pending",
		);
	}, [imports?.data]);

	useEffect(() => {
		setAutoRefresh(shouldAutoRefresh);
	}, [shouldAutoRefresh]);

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setLoading(true);

		try {
			const file = event.target.files?.[0];
			const formData = new FormData();
			formData.append("file", file!);
			const response = await fetch(`${getApiUrl()}/api/imports/tasks/upload`, {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Error uploading file");
			}

			queryClient.invalidateQueries(trpc.imports.get.queryOptions());

			toast.success("File uploaded successfully");
		} catch (error) {
			toast.error("Error uploading file");
		} finally {
			setLoading(false);
		}
	};

	const gridClass = "grid auto-cols-fr grid-flow-col gap-4";
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Import Tasks</CardTitle>
					<input
						className="flex items-center justify-center border px-2 py-1 transition-colors placeholder:text-center hover:bg-accent"
						type="file"
						accept=".csv"
						disabled={loading}
						onChange={handleFileUpload}
						placeholder="Upload CSV file"
					/>
				</div>
			</CardHeader>
			<CardContent>
				<ul>
					<li
						className={cn(gridClass, "text-end text-muted-foreground text-sm")}
					>
						<span className="text-start">File Name</span>
						<span>Status</span>
						<span>Uploaded At</span>
					</li>
					{imports?.data.map((imp) => (
						<li
							className={cn(
								gridClass,
								"border-b py-2 text-end text-sm last:border-0",
							)}
							key={imp.id}
						>
							<span className="text-start">{imp.fileName}</span>
							<span className="capitalize">
								<Badge
									variant={imp.status === "completed" ? "default" : "outline"}
								>
									{imp.status}
								</Badge>
							</span>
							<span>{new Date(imp.createdAt!).toLocaleString()}</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
