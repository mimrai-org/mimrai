type Part = {
	mimeType?: string;
	filename?: string;
	body?: { data?: string; attachmentId?: string; size?: number };
	parts?: Part[];
};

function base64UrlDecode(data: string): string {
	// Gmail uses base64url: - and _ instead of + and /, and sometimes no padding.
	const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
	return Buffer.from(padded, "base64").toString("utf8");
}

function collectBodies(part: Part, out: { mime: string; data: string }[] = []) {
	const mime = part.mimeType ?? "";
	const data = part.body?.data;

	// Skip attachments (they often have filename or attachmentId without inline data)
	const isAttachment = !!part.filename || (!!part.body?.attachmentId && !data);

	if (
		!isAttachment &&
		data &&
		(mime === "text/plain" || mime === "text/html")
	) {
		out.push({ mime, data });
	}

	for (const p of part.parts ?? []) {
		collectBodies(p, out);
	}
	return out;
}

export function getBestBody(
	message: any,
): { mimeType: string; body: string } | null {
	const payload: Part = message?.payload;
	if (!payload) return null;

	const bodies = collectBodies(payload);

	// Prefer plain text, then html
	const plain = bodies.find((b) => b.mime === "text/plain");
	if (plain)
		return { mimeType: "text/plain", body: base64UrlDecode(plain.data) };

	const html = bodies.find((b) => b.mime === "text/html");
	if (html) return { mimeType: "text/html", body: base64UrlDecode(html.data) };

	// Sometimes the top-level payload.body.data is used without parts
	const topData = (payload as any)?.body?.data;
	if (topData)
		return {
			mimeType: payload.mimeType ?? "unknown",
			body: base64UrlDecode(topData),
		};

	return null;
}

export function getHeader(
	message: any,
	headerName: string,
): string | undefined {
	const headers = message?.payload?.headers ?? [];
	const h = headers.find(
		(x: any) => x.name?.toLowerCase() === headerName.toLowerCase(),
	);
	return h?.value;
}

export const decodeEmail = (message: any) => {
	const subject = getHeader(message, "Subject") || "(No Subject)";
	const from = getHeader(message, "From") || "(Unknown Sender)";
	const to = getHeader(message, "To") || "(Unknown Recipient)";
	const date = getHeader(message, "Date") || "(Unknown Date)";

	const bodyData = getBestBody(message);
	const body = bodyData ? bodyData.body : "(No Body Content)";

	return {
		id: message.id,
		subject,
		from,
		to,
		date,
		body,
	};
};

export type DecodedEmail = ReturnType<typeof decodeEmail>;
