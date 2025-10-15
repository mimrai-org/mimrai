import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function createAdminClient() {
	return createSupabaseClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_KEY!,
	);
}
