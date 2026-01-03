import { createAdminClient } from "@api/lib/supabase";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

app.post("/upload", async (c) => {
	const session = c.get("session");
	const teamId = c.get("teamId");
	const userId = session.userId;
	const formData = await c.req.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return c.json({ success: false, message: "No file uploaded" }, 400);
	}

	const supabase = await createAdminClient();

	const [name, ext] = file.name.split(".");

	// upload the file to supabase storage
	const { data, error } = await supabase.storage
		.from("vault")
		.upload(`${teamId}/${name}-${Date.now()}.${ext}`, file, {
			cacheControl: "3600",
			upsert: true,
		});

	if (error) {
		console.error("Error uploading file:", error);
		return c.json({ success: false, message: "Error uploading file" }, 500);
	}

	return c.json({
		success: true,
		fullPath: data.fullPath,
		url: supabase.storage.from("vault").getPublicUrl(data.path).data.publicUrl,
	});
});

export { app as attachmentsRouter };
