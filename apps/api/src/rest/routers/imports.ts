import { createAdminClient } from "@api/lib/supabase";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createImport, updateImportStatus } from "@mimir/db/queries/imports";
import { tasksImportJob } from "@mimir/jobs/imports/tasks-import-job";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

app.post("/tasks/upload", async (c) => {
	const session = c.get("session");
	const teamId = c.get("teamId");
	const userId = session.userId;
	const formData = await c.req.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return c.json({ success: false, message: "No file uploaded" }, 400);
	}

	const supabase = await createAdminClient();

	// upload the file to supabase storage
	const { data, error } = await supabase.storage
		.from("imports")
		.upload(`${userId}/${file.name}`, file, {
			cacheControl: "3600",
			upsert: true,
		});

	if (error) {
		console.error("Error uploading file:", error);
		return c.json({ success: false, message: "Error uploading file" }, 500);
	}

	// create a new record in the imports table
	let taskImport = await createImport({
		userId,
		fileName: file.name,
		filePath: data.path,
		teamId,
	});

	const job = await tasksImportJob.trigger({
		importId: taskImport.id,
	});

	taskImport = await updateImportStatus({
		status: "pending",
		id: taskImport.id,
		teamId,
		jobId: job.id,
	});

	return c.json({ success: true, taskImport });
});

export { app as importsRouter };
