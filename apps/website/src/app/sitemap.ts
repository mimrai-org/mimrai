import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
	return [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }];
}
